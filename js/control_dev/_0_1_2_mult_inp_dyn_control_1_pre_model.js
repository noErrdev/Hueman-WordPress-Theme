//MULTI CONTROL CLASS
//extends api.CZRBaseControl
//
//Setup the collection of mono models
//renders the control view
//Listen to mono models collection changes and update the control setting

var CZRMultiInputDynMethods = CZRMultiInputDynMethods || {};

$.extend( CZRMultiInputDynMethods, {
  // updatePreModel : function(obj) {
  //       //get the changed property and val
  //       //=> all html input have data-type attribute corresponding to the ones stored in the model
  //       var control           = this,
  //           $_changed_input   = $(obj.dom_event.currentTarget, obj.dom_el ),
  //           _changed_prop     = $_changed_input.attr('data-type'),
  //           _new_val          = $( $_changed_input, obj.dom_el ).val(),
  //           _new_model        = _.clone(control.czr_preModel('model').get());//initialize it to the current value

  //       //make sure the title has not been emptied. If so, replace it with the default title.
  //       if ( 'title' == _changed_prop && _.isEmpty(_new_val) ) {
  //         _defaultModel = control.getDefaultModel();
  //         _new_val = _defaultModel.title;
  //       }

  //       _new_model[_changed_prop] = _new_val;

  //       //set the new val to preModel Value()
  //       control.czr_preModel('model').set(_new_model);

  //       control.doActions(
  //         'pre_model:' + _changed_prop + ':changed',
  //         control.container,
  //         { model : _new_model, dom_el : $('.' + control.css_attr.pre_add_view_content, control.container ) }
  //       );
  // }

});//$.extend//CZRBaseControlMethods