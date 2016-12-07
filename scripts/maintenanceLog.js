var maintenanceApp = {};

(function($){

	maintenanceApp.LogItem = Backbone.Model.extend();

	maintenanceApp.MaintenanceLog = Backbone.Collection.extend({
		carId: null,
		model: maintenanceApp.LogItem,
		url: function() {
			return "/api/car/" + this.carId + "/logs/";
		}
	});

	maintenanceApp.EditDialog = Backbone.View.extend({
		initialize: function() {
			_.bindAll(this, 'render');
			this.render();
		},

		render: function() {
			var that = this;
			$( "#editLogDialog" ).dialog( "option", "buttons", 
				{
					OK: function () {

						$(this).dialog("close");
						var sqlDate = DATEUTILS.sql(new Date($("#editFriendlyDate").val()));
						that.model.set({
							serviceDate: sqlDate,
							id: $("#editId").val(),
							mileage: $("#editMileage").val(),
							service: $("#editService").val(),
							note: $("#editNote").val(),
							cost: $("#editCost").val()
						});
						that.model.save();

					}
				}
			);
  
  			var log = this.model.toJSON();
		    $('#editFriendlyDate').val(DATEUTILS.format(new Date(log.serviceDate)));
			$("#editId").val(log.id);
			$("#editMileage").val(log.mileage);
			$("#editService").val(log.service);
			$("#editNote").val(log.note);
			$("#editCost").val(log.cost);

			//hide regular service form
			$('#editServiceForm').hide();
			$('#editRegularService').prop( "checked", false );
			$('#editMileageInterval').val("");
			$('#editMonthsInterval').val("");

		    $( "#editLogDialog" ).dialog( "open" );

		}
	});

	maintenanceApp.LogItemView = Backbone.View.extend({
		template: $("#logGrid").children().clone(),
		parent: $("table tbody"),
		initialize: function() {
			_.bindAll(this, 'render');

			this.$el = this.template.clone();
			this.$el.show();

			this.parent.prepend(this.$el);

			this.listenTo(this.model, "change", this.render);
			this.render();
		},

		render: function() {
			var that = this;
			var log = this.model.toJSON();
			this.$el.find(".date").html(DATEUTILS.format(new Date(log.serviceDate)));
			this.$el.find(".mileage").html(log.mileage);
			this.$el.find(".service").html(log.service);
			this.$el.find(".cost").html(log.cost);
			this.$el.find(".notes").html(log.note);
			this.$el.find(".actions A").attr("href", "#maintenanceId=" + log.id);
			this.$el.find(".actions A").on("click", function(e) {
				new maintenanceApp.EditDialog({model: that.model});
			});
			this.$el.attr("data",log.service);
		}
	});

	maintenanceApp.MaintenanceLogView = Backbone.View.extend({
		initialize: function() {
			_.bindAll(this, 'render');

			this.listenTo(this.collection, "add", this.render);
			this.listenTo(this.collection, "reset", this.render);

			this.render();
		},

		render: function() {
			$("table tbody").empty();
			_.each(this.collection.models, function(d) {
				new maintenanceApp.LogItemView({model: d});
			}, this);
		}

	});

	maintenanceApp.AddLogView = Backbone.View.extend({
		initialize: function() {
			_.bindAll(this, 'render');
			this.render();
		},

		render: function() {
			var that = this;
			$("#maintenance").submit(function(e) {
				e.preventDefault();
				
				var gridFriendlyDate = $("#gridFriendlyDate").val();
				if (gridFriendlyDate.length===0)
					gridFriendlyDate = $("#gridFriendlyDate").attr('placeholder');

				var log = new maintenanceApp.LogItem({
					carId: that.collection.carId,
					serviceDate: DATEUTILS.sql(new Date(gridFriendlyDate)),
					mileage: $("#gridMileage").val(),
					service: $("#gridService").val(),
					cost: $("#gridCost").val(),
					note:  $("#gridNote").val()
				});

				that.collection.add(log);
				log.save();

				TableFilter.clear();
				AutoComplete.clear($("#gridService"));
				$("#gridCost").val("");
				$("#gridService").val("");
				$("#gridService").focus();
			});
		}	
	});


	})(jQuery);

var DATEUTILS = {
	regex: /^(January|February|March|April|May|June|July|August|September|November|December)\s\d{1,2},\s20\d\d$/i,
	format: function(d){
		return this.months[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
	},
	sql: function(d){
		return d.getFullYear() + "-" + (d.getMonth()+1) + "-" + d.getDate();
	},
	isValid: function(s) {
		return !(s.match(DATEUTILS.regex) === null);
	},
	months: ["January","February","March","April","May","June","July","August","September","October", "November","December"]
}

var SERVICE_AUTOCOMPLETE_PLUGIN = {
	filter: function(collection, criteria){
		return jQuery.grep(collection.toJSON(), function( n, i ){
	        	return n.service.contains(criteria)});
	},
	render: function(matched){
		return matched.service;
	}
};

var DATE_AUTOCOMPELTE_PLUGIN = {
	filter: function(collection, criteria){
		return jQuery.grep(collection, function( n, i ){
	        	return n.startsWith(criteria)});
	},
 	render: function(match){
		return match;
	}
};

var TableFilter = {
	create: function(selector, tableEl) {
		var that = this;
		$(selector).on('keypress', function(e){
			that.filter($(this).data("inlineauto"), tableEl);
		});

		return this;
	},
	filter: function (criteria, tableEl) {
		console.log("Filter: " + criteria);
		$(tableEl).each(function( index ) {
			if ($(this).attr("data").contains(criteria))
				$(this).show();
			else 
				$(this).hide();
		});
	},
	clear: function(){
		$("table tbody tr").show();
	}

};

var AutoComplete = {
	create: function(selector, plugin, collection) {
		var that = this;
		$(selector).on('focus', function(e){
		    $(this).data("inlineauto",$(this).val())
		});
		$(selector).on('keypress', function(e){
			if (that.doComplete($(this), e.which, collection, plugin))
	        	e.preventDefault();
		});
		$(selector).on('keydown', function(e){
			if (e.which === 8){
		        if ($(this).data("inlineauto")){
				    e.preventDefault();
		        	var curVal = $(this).data("inlineauto");
		        	var newVal = curVal.substring(0,curVal.length-1);
			        $(this).val(newVal);
				    $(this).data("inlineauto",newVal);
				}
			}
		});

		return this;
	},
	doComplete: function (inputField, keyChar, collection, plugin){
			var key = String.fromCharCode(keyChar),
	        	criteria;

			if (keyChar === 13){
				return false;
			}

	        //append current key to autocomplete
	        if (inputField.data("inlineauto")){
		        criteria = inputField.data("inlineauto") + key;
		    } else {
		    	criteria = key;
		    }

	        //save current autocomplete value
		    inputField.data("inlineauto",criteria);

	        console.log("Autocomplete: " + criteria);

	        //find matching values
	        var matched =plugin.filter(collection,criteria);

	        //if no match set value to current autocomplete
	        if (matched.length==0) {
	        	inputField.val(criteria);
	    	} else {
	    		//display the match but keep cursor position
	        	inputField.val(plugin.render(matched[0]));
	        }

		    return true;
	},
	clear: function(inputField){
		inputField.val("");
		inputField.removeData("inlineauto");
	}
};

var UTILS = {
	hashParam: function(link){
		var hash = link.substring(link.indexOf('#')+1);
    	var params = hash.split('&');
    	var result = {};
    	for(var i = 0; i < params.length; i++){
       		var propval = params[i].split('=');
       		result[propval[0]] = propval[1];
       	}

       	return result;
	}
}


String.prototype.contains = function(it) { return this.indexOf(it) != -1; };	