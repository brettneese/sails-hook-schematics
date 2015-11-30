var util = require('util'),
actionUtil = require('./helpers/actionUtil'),
async = require('async');

/**
     * Find Records
     *
     *  get   /:modelIdentity
     *   *    /:modelIdentity/find
     *
     * An API call to find and return model instances from the data adapter
     * using the specified criteria.  If an id was specified, just the instance
     * with that unique id will be returned.
     *
     * Optional:
     * @param {Object} where       - the find criteria (passed directly to the ORM)
     * @param {Integer} limit      - the maximum number of records to send back (useful for pagination)
     * @param {Integer} skip       - the number of records to skip (useful for pagination)
     * @param {String} sort        - the order of returned records, e.g. `name ASC` or `age DESC`
     * @param {String} callback - default jsonp callback param (i.e. the name of the js function returned)
     */
module.exports = function findRecords(req, res){
	// Look up the model
	var Model = actionUtil.parseModel(req, this.modelName);
	var self = this;
	// If an `id` param was specified, use the findOne blueprint action
	// to grab the particular instance with its primary key === the value
	// of the `id` param.   (mainly here for compatibility for 0.9, where
	// there was no separate `findOne` action)
	if(actionUtil.parsePk(req)) {
		return this.findOne(req, res);
	}

	var opts = _.defaults({}, this.getQueryConfiguration(req, 'find'), {
		criteria: true,
		where: null,
		limit: true,
		skip: true,
		sort: true,
		populate: true
	});

	// Lookup for records that match the specified criteria
	var query = Model.find();

	if(opts.criteria) {
		query = query.where(actionUtil.parseCriteria(req, opts.blacklist));
	}

	if(opts.where) {
		query = query.where(opts.where);
	}

	if(opts.limit) {
		if(_.isNumber(actionUtil.parseLimit(req))){
			query = query.limit(actionUtil.parseLimit(req));
		}                
	}

	if(opts.skip) {
		query = query.skip(actionUtil.parseSkip(req));
	}

	if(opts.sort) {
		if(_.isString(opts.sort)) {
			query = query.sort(opts.sort);
		} else {
			query = query.sort(actionUtil.parseSort(req));
		}
	}

	if(opts.populate) {
		if(_.isArray(opts.populate)) {
			_.each(opts.populate, function(populate){
				query = query.populate(populate);
			});
		} else {
			query = actionUtil.populateEach(query, req);
		}
	}
	query.exec(function found(err, matchingRecords){
		if(err) {
			return res.serverError(err);
		}
		// Only `.watch()` for new instances of the model if
		// `autoWatch` is enabled.
		if(req._sails.hooks.pubsub && req.isSocket) {
			Model.subscribe(req, matchingRecords);

			if(req.options.autoWatch) {
				Model.watch(req);
			}
			// Also subscribe to instances of all associated models
			_.each(matchingRecords, function(record){
				actionUtil.subscribeDeep(req, record);
			});
		}
		async.filter(matchingRecords, function(model, cb){
			self.canList(req, model, function(err, value){
				cb(!err && value);
			});
		}, function(matchingRecords){
			// Only `.watch()` for new instances of the model if
			// `autoWatch` is enabled.
			if(req._sails.hooks.pubsub && req.isSocket) {
				Model.subscribe(req, matchingRecords);

				if(req.options.autoWatch) {
					Model.watch(req);
				}
				// Also subscribe to instances of all associated models
				_.each(matchingRecords, function(record){
					actionUtil.subscribeDeep(req, record);
				});
			}
			// Build set of model values
			async.map(matchingRecords, function(model, cb){
				self.export(req, model, cb);
			}, function(err, modelValues){
				if(err) {
					return res.serverError(err);
				}
				res.ok(modelValues);
			});
		});
	});
};