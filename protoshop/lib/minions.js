/**
 * Created with IntelliJ IDEA.
 * User: derekking
 * Date: 25/09/2013
 * Time: 11:33
 * To change this template use File | Settings | File Templates.
 */

(function( window, undefined ) {
	if (window === undefined || self !== window) {
		error("minion-master.js must be used in a window context");
		return;
	}

	var Minions = function( folder ) {
		var canUseWorkers = window.Worker !== undefined,
			canUseTransferable = false;

		this.setFolder = function( path ) {
			this.folder = (path === "" || path === null || path === undefined) ? "" : String(path + "/").replace(/\/+$/, "/");
			this.slavePath = minionFolder + "minions-worker.js";
		}

		this.setFolder( folder );

		this.createMinion = function( code, context) {
			var trueWorker,
				fakeWorker;

			if (typeof( code ) === "function") {
				code = code.toString();
			}

			if (canUseWorkers) {
				trueWorker = new Worker(this.slavePath);
				// TODO:
			} else {
				fakeWorker = {
					context: context,
					code: code,
					sendMessage: function()

				}
			}
		}

	}

	// TODO: see if there is some way do determine the minions folder location
	var folder;
	var minions = window.minions = new Minions( folder );


	function error( msg ) {
		throw new Error( msg );
	}
})(window);