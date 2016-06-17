//extends api.CZRDynModule
//This module populates the sektions setting.
//The each sektion is composed of columns (=> columns on front end)
//Each columns of modules ( => content module on front end like slider, text block, etc)

var CZRSektionMths = CZRSektionMths || {};

$.extend( CZRSektionMths, {
  initialize: function( id, options ) {
          var module = this;
          //run the parent initialize
          api.CZRDynModule.prototype.initialize.call( module, id, options );

          //extend the module with new template Selectors
          $.extend( module, {
                viewPreAddEl : 'czr-module-sektion-pre-add-view-content',
                viewTemplateEl : 'czr-module-sektion-item-view',
                viewContentTemplateEl : 'czr-module-sektion-view-content',
          } );

          //SEKTIONS
          //declares a default model (overrides parent module)
          module.defaultItemModel = {
                id : '',
                'sektion-layout' : 1,
                columns : []
          };


          //COLUMNS
          module.defaultDBColumnModel = {
                id : '',
                sektion_id : '',
                modules : [],
          };

          module.defaultAPIcolumnModel = {
                id : '',
                modules : [],
                sektion : {},//sektion instance
                module_id : '',
                control_id : '',
                is_added_by_user : false
          };

          //the column values
          module.czr_Column = new api.Values();
          //stores the column collection
          //set the initial value
          module.czr_columnCollection = new api.Value();
          module.czr_columnCollection.set([]);

          //react to column collection changes
          module.czr_columnCollection.callbacks.add( function() { return module.columnCollectionReact.apply(module, arguments ); } );

          //EXTEND THE DEFAULT CONSTRUCTORS FOR SEKTION ITEMS
          module.itemConstructor = api.CZRItem.extend( module.CZRSektionItem || {} );


          //FIRE
          api.section( module.control.section() ).expanded.bind(function(to) {
                if ( 'resolved' == module.isReady.state() )
                  return;
                //unleash hell
                module.ready();

                //provide the synchronized module-collection control with its synchronized sektions module instance
                api.control( api.CZR_Helpers.build_setId( 'module-collection') ).syncSektionModule.set( module );
          });

          if ( ! _.has( module ,'dragInstance' ) )
            module.initDragula();

  },//initialize













  /////////////////////////////////////////////////////////////////////////
  /// SEKTION
  ////////////////////////////////////////////////////////////////////////


  //React to a single item change
  //cb of module.czr_Item(item.id).callbacks
  itemReact : function( to, from ) {
        console.log('IN ITEM REACT (OVERRIDES PARENT)', to, from );
        var module = this,
            sektion_candidate = $.extend(true, {}, to);
        console.log('sektion_candidate BEFORE', sektion_candidate );
        //we want to make sure that the item model is compliant with default model
        sektion_candidate = module.prepareSekItemForDB( sektion_candidate );
        console.log('sektion_candidate AFTER', sektion_candidate );
        //update the collection
        module.updateItemsCollection( {item : sektion_candidate });
  },



  //the sektion item model must have only the property set in
  //module.defaultItemModel = {
  //       id : '',
  //       'sektion-layout' : 1,
  //       columns : []
  // };
  prepareSekItemForDB : function( sektion_candidate ) {
        var module = this,
            db_ready_sektItem = {};

        _.each( module.defaultItemModel, function( _value, _key ) {
            var _candidate_val = sektion_candidate[_key];
            switch( _key ) {
                  case 'id' :
                      if ( ! _.isString( _candidate_val ) || _.isEmpty( _candidate_val ) ) {
                          throw new Error('The sekItem id property must be a not empty string');
                      }
                      db_ready_sektItem[_key] = _candidate_val;
                  break;
                  case 'sektion-layout' :
                      if ( ! _.isNumber( parseInt( _candidate_val, 10 ) ) || ( parseInt( _candidate_val, 10 ) < 1 ) ) {
                          throw new Error('The sekItem layout property must be an int number > 0');
                      }
                      db_ready_sektItem[_key] = _candidate_val;
                  break;
                  case 'columns' :
                      if ( ! _.isArray( _candidate_val ) ) {
                          throw new Error('The sekItem columns property must be an array');
                      }
                      var _db_ready_columns = [];
                      _.each( _candidate_val, function( _col ) {
                            var _db_ready_col = module.prepareColumnForDB(_col);
                            _db_ready_columns.push( _db_ready_col );
                      });
                      console.log(' _db_ready_columns',  _db_ready_columns);
                      db_ready_sektItem[_key] = _db_ready_columns;
                  break;
            }
        });//each

        return db_ready_sektItem;
  },


  //Each column shall be described by an object like the following one :
  //module.defaultDBColumnModel = {
  //       id : '',
  //       sektion_id : '',
  //       modules : [],
  // };
  prepareColumnForDB : function( column_candidate ) {
        var module = this,
            _db_ready_col = {};
            console.log('column_candidatecolumn_candidatecolumn_candidate', column_candidate );
        _.each( module.defaultDBColumnModel, function( _value, _key ){
              var _candidate_val = column_candidate[_key];
              switch( _key ) {
                  case 'id' :
                      if ( ! _.isString( _candidate_val ) || _.isEmpty( _candidate_val ) ) {
                          throw new Error('The column id property must be a not empty string');
                      }
                      _db_ready_col[_key] = _candidate_val;
                  break;
                  case 'sektion_id' :
                      if ( _.isString( _candidate_val ) && ! _.isEmpty( _candidate_val ) ) {
                          _db_ready_col[_key] = _candidate_val;
                      } else if ( _.has(column_candidate, 'sektion') ) {
                          _db_ready_col[_key] = column_candidate.sektion.id;
                      } else {
                          throw new Error('The column sektion-id property must be a not empty string');
                      }
                  break;
                  case 'modules' :
                      if ( ! _.isArray( _candidate_val ) ) {
                          throw new Error('The column modules property must be an array');
                      }
                      _db_ready_col[_key] = _candidate_val;
                  break;
              }

        } );
        return _db_ready_col;
  },











  /////////////////////////////////////////////////////////////////////////
  /// COLUMN
  ////////////////////////////////////////////////////////////////////////
  //At this point, the column model has been fetched from DB, or manually added.
  //It must look like
  //{
  //  id : '',//string
  //  sektion : {},//sektion instance
  //  sektion_id : '',//string
  //  modules : [],//collection of module id strings
  //}
  instantiateColumn : function( _column, is_added_by_user  ) {
        var module = this,
            column_model = _.clone( _column );

        console.log('db column model', column_model );

        if ( ! _.isEmpty( column_model.id ) && module.czr_Column.has( column_model.id ) ) {
              throw new Error('The column id already exists in the collection in module : ' + module.id );
        }

        column_model = module.prepareColumnForAPI( column_model );

        console.log('extended column model before api instantiation : ', column_model );
        //instanciate the column with the default constructor
        //=> makes sure that the column is ready for instanciation
        module.czr_Column.add( column_model.id , new api.CZRColumn( column_model.id, column_model ) );

        //the column is now ready and will listen to changes
        module.czr_Column(column_model.id).ready();
  },


  //Let's make sure the column holds all the necessary properties before API instanciation.
  // module.defaultAPIcolumnModel = {
  //       id : '',
  //       modules : [],
  //       sektion : {}, //sektion instance
  //       module_id : '',
  //       control_id : '',
  //       is_added_by_user : false
  // };
  prepareColumnForAPI : function( column_candidate ) {
      var module = this,
          api_ready_column = {};
          //normalize it now
          // _default_module_model = _.clone( control.defautAPIModuleModel ),
          // _module_model = $.extend( _default_module_model, _module_candidate_model );
      if ( ! _.isObject( column_candidate ) ) {
            throw new Error('Sektion Module::prepareColumnForAPI : a column must be an object to be instantiated.');
        }

      _.each( module.defaultAPIcolumnModel, function( _value, _key ) {
            var _candidate_val = column_candidate[_key];
            switch( _key ) {
                  case 'id' :
                      if ( _.isEmpty( _candidate_val ) ) {
                          api_ready_column[_key] = module.generateColId();
                      } else {
                          api_ready_column[_key] = _candidate_val;
                      }
                  break;
                  case 'modules' :
                      if ( ! _.isArray( _candidate_val )  ) {
                          throw new Error('Sektion Module::prepareColumnForAPI : a collection of modules must be an array. Error in column ' + column_candidate.id );
                      }
                      api_ready_column[_key] = _candidate_val;
                  break;
                  case  'sektion' :
                      if ( ! _.isObject( _candidate_val ) || _.isEmpty( _candidate_val )  ) {
                          throw new Error('Sektion Module::prepareColumnForAPI : a sektion instance is missing for column ' + column_candidate.id );
                      }
                      api_ready_column[_key] = _candidate_val;
                  break;
                  case  'module_id' :
                      api_ready_column[_key] = module.id;
                  break;
                  case  'control_id' :
                      api_ready_column[_key] = module.control.id;
                  break;
                  case 'is_added_by_user' :
                      api_ready_column[_key] =  _.isBoolean( _candidate_val ) ? _candidate_val : false;
                  break;
            }//switch
      });
      return api_ready_column;
  },




  //@param obj can be { collection : []}, or { module : {} }
  updateColumnCollection : function( obj ) {
        console.log('IN UPDATE GLOBAL COLUMN COLLECTION', obj );
        var module = this,
            _current_collection = module.czr_columnCollection.get();
            _new_collection = _.clone(_current_collection);

        //if a collection is provided in the passed obj then simply refresh the collection
        //=> typically used when reordering the collection module with sortable or when a column is removed
        if ( _.has( obj, 'collection' ) ) {
              //reset the collection
              module.czr_columnCollection.set(obj.collection);
              return;
        }

        if ( ! _.has(obj, 'column') ) {
          throw new Error('updateColumnCollection, no column provided in module ' + module.id + '. Aborting');
        }
        var column = _.clone(obj.column);

        if ( ! _.has(column, 'id') ) {
          throw new Error('updateColumnCollection, no id provided for a column in module' + module.id + '. Aborting');
        }
        //the module already exist in the collection
        if ( _.findWhere( _new_collection, { id : column.id } ) ) {
              _.each( _current_collection , function( _elt, _ind ) {
                    if ( _elt.id != column.id )
                      return;

                    //set the new val to the changed property
                    _new_collection[_ind] = column;
              });
        }
        //the module has to be added
        else {
              _new_collection.push(column);
        }

        //Inform the column sektion
        //column.sektion.updateSektionColumnCollection( { column : column });
        //Inform the global column collection
        module.czr_columnCollection.set(_new_collection);
  },


  //cb of control.czr_columnCollection.callbacks
  //The job of this function is to set the column collection in their respective sektItems
  columnCollectionReact : function( to, from ) {
        console.log('IN Global Column collection react. DIFFERENCE ? ', to, from, _.difference(to,from)[0] );
        var module = this,
            _to_add = ( _.size(from) < _.size(to) ) ? _.difference(to,from)[0] : {},
            _to_remove = ( _.size(from) > _.size(to) ) ? _.difference(from, to)[0] : {},
            _column_updated = ( ( _.size(from) == _.size(to) ) && !_.isEmpty( _.difference(from, to) ) ) ? _.difference(to,from)[0] : {},
            is_column_update = ! _.isEmpty( _column_updated ),
            is_column_collection_sorted = _.isEmpty(_to_add) && _.isEmpty(_to_remove)  && ! is_column_update;

        if ( is_column_update ) {
              console.log('THE COLUMN ' + _column_updated.id + ' HAS BEEN UPDATED.', _column_updated );
              //say it to the sektion
              var _current_sek_model = _column_updated.sektion.get(),
                  _new_sek_model = $.extend(true, {}, _current_sek_model),//_.clone() is not enough there, we need a deep cloning.
                  _new_col = {};

              //find the column and update it
              _.each( _current_sek_model.columns, function( _col, _key ){
                    if ( _col.id != _column_updated.id )
                      return;
                    _new_sek_model.columns[_key] = _column_updated;
              } );

              console.log( '_.isEqual( _current_sek_model, _new_sek_model );', _.isEqual( _current_sek_model, _new_sek_model ), _current_sek_model , _new_sek_model );

              console.log('SEKTION ' + _column_updated.sektion.id + ' HAS TO BE UPDATED.', _new_sek_model );
              _column_updated.sektion.set( _new_sek_model );
        }


        //loop the new column collection
        //=> set each sektion column collection
        // _.each( to, function( _col, key ) {
        //       _col.sektion.updateSektionColumnCollection( { column : _col });
        // });

        //refreshes the preview frame  :
        //1) only needed if transport is postMessage, because is triggered by wp otherwise
        //2) only needed when : add, remove, sort item(s)
        //module update case
        // if ( 'postMessage' == api(control.id).transport && ! api.CZR_Helpers.has_part_refresh( control.id ) ) {
        //     if ( is_collection_sorted )
        //         control.previewer.refresh();
        // }
  },



  //recursive
  generateColId : function( key ) {
    console.log('in generate Col id : ', key );
        var module = this;
        key = key || module.czr_columnCollection.get().length + 1;
        var id_candidate = 'col_' + key;

        //do we have a column collection value ?
        if ( ! _.has(module, 'czr_columnCollection') || ! _.isArray( module.czr_columnCollection.get() ) ) {
              throw new Error('The column collection does not exist or is not properly set in module : ' + module.id );
        }
        //make sure the column is not already instantiated
        if ( module.czr_Column.has( id_candidate ) )
          return module.generateColId( key ++ );

        return id_candidate;
  },


  //@return bool
  moduleExistsInOneColumnMax : function( module_id ) {
        return 2 > this.getModuleColumn( module_id ).length;
  },


  //@return an array of columns
  //=> a module can't be embedded in several columns at a time
  //if the returned array has more than one item, it should trigger an Error.
  getModuleColumn : function( module_id ) {
        var module = this,
            _mod_columns = [];
        _.each( module.czr_columnCollection.get(), function( _col, _key ) {
              if ( _.findWhere( _col.modules, { id : module_id } ) )
                _mod_columns.push( _col.id );
        });
        return _mod_columns;
  },






















  /////////////////////////////////////////////////////////////////////////
  /// DRAGULA
  ////////////////////////////////////////////////////////////////////////
  initDragula : function() {
          var module = this;

          //instantiate dragula without container => they will be pushed on sektion items instantiation
          module.dragInstance = dragula({
              moves: function (el, source, handle, sibling) {
                  console.log("handle.className === 'czr-column'", handle.className === 'czr-column');
                   console.log('in moves cb', el, source, handle, sibling );
                  return handle.className === 'czr-column';
                  //return handle.className === 'czr-column';
                  // var is_column = $(handle).parents('.czr-column').length > 0 || $(handle).hasClass('czr-column') || $(handle).hasClass('czr-column-wrapper');
                  // console.log(is_column, $(handle).parents('.czr-column').length );
                  // if (  ! is_column ) {
                  //   console.log('NOT DRAGGABLE');
                  //   return;
                  // }

                  // return true; // modules are always draggable by default
              },
              // invalidTarget : function(el, handle) {
              //     console.log('invalidTarget', el, handle );
              //     return false;
              // },
              isContainer : function( el ) {
                //console.log('isContainer?', el);
                return false;
              }
            }
          );

          //expand a closed sektion on over
          module.dragInstance.on('over', function( el, container, source ) {
                if ( $(container).hasClass('czr-dragula-fake-container') ) {
                    //get the sekItem id
                    _target_sekId = $(container).closest('[data-id]').attr('data-id');
                    console.log( 'taget sek', _target_sekId );
                    module.czr_Item(_target_sekId).czr_View.set('expanded');
                }
          });


          //react to drag start
          module.dragInstance.on('drag', function( el, source ){
                //display the fake container to all closed sek items
                module.czr_Item.each( function( _sektion ){
                    _sektion.container.toggleClass('czr-show-fake-container', 'closed' == _sektion.czr_View.get() );
                });
          }).on('dragend', function( el, source ){
                //display the fake container to all closed sek items
                module.czr_Item.each( function( _sektion ){
                    _sektion.container.removeClass('czr-show-fake-container');
                });
          }).on('drop', function(el, target, source, sibling ) {
                console.log('element ' + el + ' has been droped in :', target );
          });

          var scroll = autoScroller([
                     module.control.container.closest('.accordion-section-content')[0]
                  ],
                  {
                    direction: "vertical",
                    margin: 20,
                    pixels: 10,
                    scrollWhenOutside: true,
                    autoScroll: function(){
                        //Only scroll when the pointer is down, and there is a child being dragged.
                        return this.down && module.dragInstance.dragging;
                    }
                  }
        );
  },//initDragula

});