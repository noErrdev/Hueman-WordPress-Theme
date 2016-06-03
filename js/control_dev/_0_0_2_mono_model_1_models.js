//extends api.CZRBaseControl
var CZRMonoModelMethods = CZRMonoModelMethods || {};

  $.extend( CZRMonoModelMethods , {
    //The idea is to send only the currently modified model instead of the entire collection
    //the entire collection is sent anyway on api(setId).set( value ), and accessible in the preview via api(setId).bind( fn( to) )
    _sendModel : function( to, from ) {
          var monoModel = this,
              control = monoModel.model_control,
              _changed_props = [];

          //which property(ies) has(ve) changed ?
          _.each( from, function( _val, _key ) {
                if ( _val != to[_key] )
                  _changed_props.push(_key);
          });

          _.each( _changed_props, function( _prop ) {
                control.previewer.send( 'sub_setting', {
                      set_id : control.id,
                      model_id : to.id,
                      changed_prop : _prop,
                      value : to[_prop]
                });

                //add a hook here
                api.CZR_Dom.doActions('after_sendModel',  monoModel.container, { model : to , dom_el: monoModel.container, changed_prop : _prop }, monoModel );
          });
    },

    //fired on click dom event
    //for dynamic multi input controls
    removeModel : function() {
            var monoModel = this,
                control = this.model_control,
                _new_collection = _.clone( control.czr_Model.czr_collection.get() );

            //destroy the Mono model DOM el
            monoModel._destroyView();

            //new collection
            //say it
            _new_collection = _.without( _new_collection, _.findWhere( _new_collection, {id: monoModel.model_id }) );
            control.czr_Model.czr_collection.set( _new_collection );
            //hook here
            control.trigger('item_removed', monoModel.get() );
            //remove the mono model from the collection
            control.czr_Model.remove(monoModel.model_id);
    },

    //@return the model {...} from the collection
    //takes a model unique id as param
    getModel : function(id) {
            return this.get();
    }

  });//$.extend

