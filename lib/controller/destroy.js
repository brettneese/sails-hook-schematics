/**
 * Module dependencies
 */
var util = require('util'),
  actionUtil = require('./helpers/actionUtil');



/**
 * Destroy One Record
 *
 * delete  /:modelIdentity/:id
 *    *    /:modelIdentity/destroy/:id
 *
 * Destroys the single model instance with the specified `id` from
 * the data adapter for the given model if it exists.
 *
 * Required:
 * @param {Integer|String} id  - the unique id of the particular instance you'd like to delete
 *
 * Optional:
 * @param {String} callback - default jsonp callback param (i.e. the name of the js function returned)
 */
module.exports = function destroyOneRecord(req, res){

	var Model = actionUtil.parseModel(req, this.modelName);
	var pk = actionUtil.requirePk(req);
	var self = this;

	var query = Model.findOne(pk);

	query = actionUtil.populateEach(query, req);
	query.exec(function foundRecord(err, record){
		if(err) {return res.serverError(err);}

		if(!record) {return res.notFound('No record found with the specified `id`.');}

		self.canDelete(req, record, function(err, value){
		if(err){return res.serverError(err);}

		if(!value){return res.forbidden({
			error: 'You are not authorized to delete this ' + Model.globalId
		});}

		self.beforeDelete(req, record, function(err, record){
			if(err){return res.serverError(err);}

			if(!record){
				return res.ok(null);
			}

			Model.destroy(pk).exec(function destroyedRecord(err){
				if(err) {return res.negotiate(err);}

				if(sails.hooks.pubsub) {
					Model.publishDestroy(pk, !sails.config.blueprints.mirror && req, {
						previous: record
					});

					if(req.isSocket) {
						Model.unsubscribe(req, record);
						Model.retire(record);
					}
				}

				self.afterDelete(req, record, function(err){
					if(err) {return res.serverError(err);}
					res.ok(record);
				});
			});
		});
	});

    
	});
};
