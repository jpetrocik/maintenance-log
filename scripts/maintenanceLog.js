var maintanenceLog = function() {
	this.logs = {};

	this.load = function(carId, callback) {
		$.ajax({
			context: this,
			url: '/api/logs',
		  	data: {carId: carId},
		  	success: function(data, status) {
				for(var i = 0; i < data.length; i++){
			  		this.logs[data[i].id] = data[i];
			  		this.fireLogAdded(data[i]);
				}
				callback(data);
			}
		});
	};

	this.get = function(id) {
		return this.logs[id];
	};

	this.add = function(rec){
		$.ajax({
			context: this,
			url: '/api/addLog',
		  	data: rec,
		  	success: function(data, status) {
				var results = rec.reduce(function(a, x) { a[x.name] = x.value; return a; }, {})
				results.id = data.id;
		  		this.logs[data.id] = results;
		  		this.fireLogAdded(results);
		  	}
		});

	};

	this.update = function(rec) {
		$.ajax({
			context: this,
			url: '/api/updateLog',
			data: rec,
			success: function(data, status) {
				var results = rec.reduce(function(a, x) { a[x.name] = x.value; return a; }, {})
				this.fireLogUpdated(results)
			}
		});
	};

	this.fireLogAdded = function(data) {
		console.log("logAdded");
		var event = jQuery.Event("logAdded");
		event.log = data;
		$(".logAddEvent").trigger(event);
	};

	this.fireLogDelete = function() {};

	this.fireLogUpdated = function(data) {
		console.log("logUpdated");
		var event = jQuery.Event("logUpdated");
		event.log = data;
		$(".logUpdateEvent.log" + data.id).trigger(event);
	};
};
