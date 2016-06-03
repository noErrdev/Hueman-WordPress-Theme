//extends api.CZRBaseControl
var CZRItemMths = CZRItemMths || {};

$.extend( CZRItemMths , {
  //////////////////////////////////////////////////
  /// VIEWS
  //////////////////////////////////////////////////
  //the view wrapper has been rendered by WP
  //the content ( the various inputs ) is rendered by the following methods
  //an event is triggered on the control.container when content is rendered
  renderView : function( model ) {
        //=> an array of objects
        var item = this,
            control = item.item_control;
        model = model || item.get();
        //do we have view template script?
        if ( 0 === $( '#tmpl-' + control.getTemplateEl( 'view', model ) ).length )
          return false;//break the action chain

        var view_template = wp.template( control.getTemplateEl( 'view', model ) );

        //do we have an html template and a control container?
        if ( ! view_template  || ! control.container )
          return;

        //has this model view already been rendered?
        if ( _.has(item, 'container') && false !== item.container.length )
          return;

        $_view_el = $('<li>', { class : control.css_attr.inner_view, 'data-id' : model.id,  id : model.id } );
        $( '.' + control.css_attr.views_wrapper , control.container).append( $_view_el );
        //the view skeleton
        $( view_template( model ) ).appendTo( $_view_el );


        // if ( _.isEmpty($_view_el.html() ) ) {
        //   $_view_el.append( item._getViewContent() );
        // } else {
        //   //var $_view_el = $('li[data-id="' + model.id + '"]');
        //   //empty the html and append the updated content
        //   $_view_el.html( item._getViewContent() );
        // }

        // item.doActions( 'viewContentRendered' , control.container, {} );

        return $_view_el;
  },


  //renders saved models views and attach event handlers
  //the saved model look like :
  //array[ { id : 'sidebar-one', title : 'A Title One' }, {id : 'sidebar-two', title : 'A Title Two' }]
  renderViewContent : function() {
          //=> an array of objects
          var item = this,
              control = this.item_control,
              model = _.clone( item.get() );

          //do we have view content template script?
          if ( 0 === $( '#tmpl-' + control.getTemplateEl( 'view-content', model ) ).length )
            return this;

          var  view_content_template = wp.template( control.getTemplateEl( 'view-content', model ) );

          //do we have an html template and a control container?
          if ( ! view_content_template || ! control.container )
            return this;

          //the view content
          $( view_content_template( model )).appendTo( $('.' + control.css_attr.view_content, item.container ) );

          api.CZR_Helpers.doActions( 'viewContentRendered' , item.container, {model : model }, item );

          return this;
  },





  //at this stage, the model passed in the obj is up to date
  writeViewTitle : function( model ) {
        var item = this,
            control = item.item_control,
            _model = _.clone( model || item.get() ),
            _title = _.has( _model, 'title')? api.CZR_Helpers.capitalize( _model.title ) : _model.id;

        _title = api.CZR_Helpers.truncate(_title, 20);
        $( '.' + control.css_attr.view_title , '#' + _model.id ).text(_title );

        //add a hook here
        api.CZR_Helpers.doActions('after_writeViewTitle', item.container , _model, item );
  },



  //@param : obj = { event : {}, model : {}, view : ${} }
  //Fired on view_rendered:new when a new model has been added
  //Fired on click on edit_view_btn
  setViewVisibility : function( obj, is_added_by_user ) {
          var item = this,
              control = this.item_control,
              model_id = item.model_id;
          if ( is_added_by_user ) {
            item.czr_View.set( 'expanded_noscroll' );
          } else {
            control.closeAllViews(model_id);
            if ( _.has(control, 'czr_preModel') ) {
              control.czr_preModel('view_status').set( 'closed');
            }
            item.czr_View.set( 'expanded' == item._getViewState(model_id) ? 'closed' : 'expanded' );
          }
  },


  _getViewState : function(model_id) {
          return -1 == this.czr_View.get().indexOf('expanded') ? 'closed' : 'expanded';
  },


  //callback of czr_View() instance on change
  _toggleViewExpansion : function( status, duration ) {
          var item = this,
              control = this.item_control,
              model_id = item.model_id;

          //slide Toggle and toggle the 'open' class
          $( '.' + control.css_attr.view_content , item.container ).slideToggle( {
              duration : duration || 200,
              done : function() {
                var _is_expanded = 'closed' != status;

                item.container.toggleClass('open' , _is_expanded );

                //close all alerts
                control.closeAllAlerts();

                //toggle the icon activate class depending on the status
                //switch icon
                var $_edit_icon = $(this).siblings().find('.' + control.css_attr.edit_view_btn );

                $_edit_icon.toggleClass('active' , _is_expanded );
                if ( _is_expanded )
                  $_edit_icon.removeClass('fa-pencil').addClass('fa-minus-square').attr('title', serverControlParams.translatedStrings.close );
                else
                  $_edit_icon.removeClass('fa-minus-square').addClass('fa-pencil').attr('title', serverControlParams.translatedStrings.edit );

                //scroll to the currently expanded view
                if ( 'expanded' == status )
                  control._adjustScrollExpandedBlock( item.container );
              }//done callback
            } );
  },


  //toggles the visibility of the Remove View Block
  //@param : obj = { event : {}, model : {}, view : ${} }
  toggleRemoveAlertVisibility : function(obj) {
          var item = this,
              control = this.item_control,
              $_alert_el = $( '.' + control.css_attr.remove_alert_wrapper, item.container ),
              $_clicked = obj.dom_event;

          //first close all open views
          control.closeAllViews();
          if ( _.has(control, 'czr_preModel') ) {
            control.czr_preModel('view_status').set( 'closed');
          }

          //then close any other open remove alert in the control containuer
          $('.' + control.css_attr.remove_alert_wrapper, item.container ).not($_alert_el).each( function() {
            if ( $(this).hasClass('open') ) {
              $(this).slideToggle( {
                duration : 200,
                done : function() {
                  $(this).toggleClass('open' , false );
                  //deactivate the icons
                  $(this).siblings().find('.' + control.css_attr.display_alert_btn).toggleClass('active' , false );
                }
              } );
            }
          });

          //print the html
          var alert_template = wp.template( control.viewAlertEl );
          //do we have an html template and a control container?
          if ( ! alert_template  || ! item.container )
            return this;

          $_alert_el.html( alert_template( item.get() ) );

          //toggle it
          $_alert_el.slideToggle( {
            duration : 200,
            done : function() {
              var _is_open = ! $(this).hasClass('open') && $(this).is(':visible');
              $(this).toggleClass('open' , _is_open );
              //set the active class of the clicked icon
              $( obj.dom_el ).find('.' + control.css_attr.display_alert_btn).toggleClass( 'active', _is_open );
              //adjust scrolling to display the entire dialog block
              if ( _is_open )
                control._adjustScrollExpandedBlock( item.container );
            }
          } );
  },


  //removes the view dom element
  _destroyView : function (model_id) {
          this.container.fadeOut( {
            duration : 400,
            done : function() {
              $(this).remove();
            }
          });
  },
});//$.extend
