var airPlaneMod = (function(){

	var zDepth,
		top,
		right,
		bottom,
		left,
		give = 20;

	var isZSet = 
		isTopSet = 
		isRightSet = 
		isBottomSet = 
		isLeftSet = false;

	var pause = false,
		delay = 2000;

	var threshold = 200,
		percentToDrop = 0;

	var calEl,
		gained,
		output = document.getElementById('output');

	var eventToDispatch = new Event('click');

	var pointers = [],
		displayPointers = true,
		lastX = 0,
		lastY = 0,
		lastZ = 0,
		moveThreshold = 10,
		handsLeft = true,
		eventDelay = 500,
		leniance = 2;

	function checkCoordinates(frame){
		
		//========================================================================================\\
		// If we have coordinates and they are stored then start using them
		//========================================================================================\\

		var totalX = right - left;

		if(frame.fingers !== null && frame.fingers !== undefined && frame.fingers.length > 0){
			
			//========================================================================================\\
			// Here, we check for the closest finger to the screen
			// That's the one that we're concerned with at the moment
			//========================================================================================\\

			var st = 0,
				closest = 0,
				lowDepth = 0,
				cartesianFingers = [];

			
			var rw = 0;	

			while(rw < frame.fingers.length){


				var thisX = frame.fingers[rw].tipPosition[0],
					thisY = frame.fingers[rw].tipPosition[1];

				var xPer = ((thisX += (0 - left)) / (right - left)) * 100;
				var yPer = ((thisY += (0 - bottom)) / (top - bottom)) * 100;

				var cartesianX = Math.floor(0 + (window.innerWidth / 100 * xPer));
				var cartesianY = Math.floor(window.innerHeight - (window.innerHeight / 100 * yPer));
				var pointerDepth = frame.fingers[rw].tipPosition.z;

				cartesianFingers.push({x : cartesianX, y : cartesianY, z : frame.fingers[rw].tipPosition[2]});

				rw += 1;
			
			}

			return cartesianFingers;

		}

		return [];



	}

	function setDelay(time){

		if(time !== null && time !== undefined && typeof time === "number"){
		
			eventDelay = time;
		
		} else {

			console.error("Invalid input");
		
		}

	}

	function createPointer(){
		
		var cEl = document.createElement('div');
			cEl.setAttribute('class', 'cursor');

		document.body.appendChild(cEl);

		pointers.push(cEl);

	}

	function createCalEl(){
		calEl = document.createElement('div');
		calEl.setAttribute('id', 'calEl');

		gained = document.createElement('div');
		gained.setAttribute('id', 'progress');

		gained.style.position = "absolute";
		gained.style.bottom = "0";
		gained.style.width = "100%";
		gained.style.backgroundColor = "blue";

		calEl.appendChild(gained);

		document.body.appendChild(calEl);

		calEl.style.width = "50px";
		calEl.style.height = "50px";
		calEl.style.backgroundColor = "rgb(0,255,0)";
		calEl.style.position = "fixed";

		calEl.style.top = (window.innerHeight / 2) - (calEl.offsetWidth / 2) + "px";
		calEl.style.left = (window.innerWidth / 2) - (calEl.offsetHeight / 2) + "px";

		calEl.style.zIndex = "50000";

		calEl.style.display = "none";
	}

	function reset(shouldRecalibrate){

		console.log("Reset");
		localStorage.clear();
		measure.empty();

		zDepth = top = right = bottom = left = undefined;
		isZSet = isTopSet = isRightSet = isBottomSet = isLeftSet = false;
		

		calEl.style.display = "block";
		calEl.style.left = (window.innerWidth / 2) - (calEl.offsetWidth / 2);

	}

	function currentCoords(){

		return {zDepth : zDepth, top : top, right : right, bottom : bottom, left : left};

	}

	function showPointers(boolean){
		if(boolean !== false  && boolean !== true){
			console.error("Not a boolean value, Must be true or false");
			return;
		} else {
			displayPointers = boolean;
		}
	}	

	var measure = (function(){

		var zMeasure = [],
			topMeasure = [],
			rightMeasure = [],
			bottomMeasure = [],
			leftMeasure = [];

		function setZ(coords){
			
			console.log(coords);

			if(coords !== undefined & coords !== null){
				zMeasure.push(coords);
			}

			return zMeasure.length;

		}

		function getZ(){

			var total = 0;

			for(var c = 0 + Math.floor(((threshold / 100) * percentToDrop)); c < zMeasure.length; c += 1){
				total += zMeasure[c];
			}

			return total / (zMeasure.length - Math.floor(((threshold / 100) * percentToDrop)));

		}

		function setTop(coords){
			
			console.log(coords);

			if(coords !== undefined & coords !== null){
				topMeasure.push(coords);
			}

			return topMeasure.length;

		}

		function getTop(){

			var total = 0;

			for(var c = 0 + Math.floor(((threshold / 100) * percentToDrop)); c < topMeasure.length; c += 1){
				total += topMeasure[c];
			}

			return total / (topMeasure.length - Math.floor(((threshold / 100) * percentToDrop)));

		}

		function setRight(coords){
			
			console.log(coords);

			if(coords !== undefined & coords !== null){
				rightMeasure.push(coords);
			}

			return rightMeasure.length;

		}

		function getRight(){

			var total = 0;

			for(var c = 0 + Math.floor(((threshold / 100) * percentToDrop)); c < rightMeasure.length; c += 1){
				total += rightMeasure[c];
			}

			return total / (rightMeasure.length - Math.floor(((threshold / 100) * percentToDrop)));

		}

		function setBottom(coords){
			
			console.log(coords);

			if(coords !== undefined & coords !== null){
				bottomMeasure.push(coords);
			}

			return bottomMeasure.length;

		}

		function getBottom(){

			var total = 0;

			for(var c = 0 + Math.floor(((threshold / 100) * percentToDrop)); c < bottomMeasure.length; c += 1){
				total += bottomMeasure[c];
			}

			return total / (bottomMeasure.length - Math.floor(((threshold / 100) * percentToDrop)));

		}

		function setLeft(coords){

			if(coords !== undefined & coords !== null){
				leftMeasure.push(coords);
			}

			return leftMeasure.length;

		}

		function getLeft(){

			var total = 0;

			for(var c = 0 + Math.floor(((threshold / 100) * percentToDrop)); c < leftMeasure.length; c += 1){
				total += leftMeasure[c];
			}

			return total / (leftMeasure.length - Math.floor(((threshold / 100) * percentToDrop)));

		}

		function emptyArrays(){
		
			zMeasure = [];
			topMeasure = [];
			rightMeasure = [];
			bottomMeasure = [];
			leftMeasure = [];

		}

		function setAllManually(setObject){

			zDepth = setObject.z;
			top = setObject.top;
			right = setObject.right;
			bottom = setObject.bottom;
			left = setObject.left;

			isZSet = isTopSet = isRightSet = isBottomSet = isLeftSet = true;
		}

		return{
			setZ : setZ,
			getZ : getZ,
			setTop : setTop,
			getTop : getTop,
			setRight : setRight,
			getRight : getRight,
			setBottom : setBottom,
			getBottom : getBottom,
			setLeft : setLeft,
			getLeft : getLeft,
			empty : emptyArrays,
			setAll : setAllManually
		};

	})();

	return{
		checkCoords : checkCoordinates,
		measure : measure,
		reset : reset,
		currentCoords : currentCoords,
		showPointers : showPointers,
		setDelay : setDelay,
		createPointer : createPointer
	};

})();