var airPlane = (function(){

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
		delay = 2000,
		handsLeft = true;

	var settings = {
		threshold : 200,
		percentToDrop : 20,
		returnCoordinates : false,
		leniance : 2
	}

	var calEl,
		gained;

	var eventDelay = 500;

	var eventToDispatch = new Event('click');

	function checkCoordinates(frame){

		if(!calibration.isCalibrated()){
			calibration.calibrate(frame);
			return;
		}

		var totalX = right - left;

		if(frame.fingers !== null && frame.fingers !== undefined && frame.fingers.length > 0){
			
			//========================================================================================\\
			// Here, we check for the closest finger to the screen
			// That's the one that we're concerned with at the moment
			//========================================================================================\\

			var st = 0,
				closest = 0,
				lowDepth = 0;

			while(st < frame.fingers.length){
				
				if(st < frame.fingers.length){

					//========================================================================================\\
					// If the depth of the finger is les than the depth of the screen, it's likely a reflection
					// We're going to disregard those readings
					//========================================================================================\\

					if(frame.fingers[st].tipPosition[2] < lowDepth && frame.fingers[st].direction.z < 0){
						
						if(frame.fingers[st].tipPosition[2] > zDepth){
							closest = st;
							lowDepth = frame.fingers[st].tipPosition[2];	
						}
						
					}

				}
				
				st += 1;

			}

			var rw = 0,
				cartesianFingers = [];

			while(rw < frame.fingers.length){

				//========================================================================================\\
				// If this finger is visible and within a given tolerance, then we're going to track it
				// If we were tracking more than one object we wouldn't check for the closest, but here
				// we want only one pointer so we'll ignore the others
				//========================================================================================\\

				if(frame.fingers[rw].tipPosition[2] < (zDepth + (give * settings.leniance))/* && rw === closest*/){

					var thisX = frame.fingers[rw].tipPosition[0],
						thisY = frame.fingers[rw].tipPosition[1];

					var xPer = ((thisX += (0 - left)) / (right - left)) * 100;
					var yPer = ((thisY += (0 - bottom)) / (top - bottom)) * 100;

					var cartesianX = Math.floor(0 + (window.innerWidth / 100 * xPer)) + window.pageXOffset;
					var cartesianY = Math.floor(window.innerHeight - (window.innerHeight / 100 * yPer)) + window.pageYOffset;
					var pointerDepth = frame.fingers[rw].tipPosition[2];
					
					//It's time to start making assumptions

					if(pointerDepth - screenPointers.lastCoords.z > screenPointers.threshold.get() && !handsLeft && cartesianX - screenPointers.threshold.lastCoords.x > threshold.get() || pointerDepth - screenPointers.lastCoords.z > screenPointers.threshold.get() && !handsLeft && cartesianY - screenPointers.lastCoords.y > moveThreshold){
						//Right - It's glitched, We're going to keep the pointers where they are

						cartesianX = screenPointers.lastCoords.x;
						cartesianY = screenPointers.lastCoords.y;
						pointerDepth = screenPointers.lastCoords.z;
						handsLeft = false;

					} else {
						
						lastX = cartesianX;
						lastY = cartesianY;
						lastZ = pointerDepth;

					}

					if(screenPointers.get()[rw] === undefined){
						screenPointers.createPointer();
					}

					//========================================================================================\\
					// If multiple pointers, we want the option to hide the inactive ones
					//========================================================================================\\

					if(screenPointers.display()){
						screenPointers.get()[rw].style.opacity = 1;
						screenPointers.get()[rw].style.left = cartesianX + 50 + "px";
						screenPointers.get()[rw].style.top = cartesianY + "px";
					} else {
						screenPointers.get()[rw].style.opacity = 0;
					}

					//========================================================================================\\
					// If we're the closest to the screen, we're going to grab the element at the calculated 
					// coordinates and then if we're close enough dispatch an event to those coordinates.
					// We then set the pause variable to TRUE with a setTimeout so that we don't constantly
					// push the same button. It gives the user time to move and select something else
					//========================================================================================\\

					if(rw === closest && frame.fingers[rw].tipPosition[2] < (zDepth + give)){

						var elementAtCoords = document.elementFromPoint(cartesianX, cartesianY);

						screenPointers.get()[rw].style.opacity = 1;

						if(elementAtCoords !== null && !pause){

							console.log(elementAtCoords);

							elementAtCoords.dispatchEvent(eventToDispatch);

							(function(){
								
								pause = true

								setTimeout(function(){
									pause = false;
								}, eventDelay);

							})();

						}

					}

					cartesianFingers.push({x : cartesianX, y : cartesianY, z : frame.fingers[rw].tipPosition[2]});

				} else {
					
					//========================================================================================\\
					// If multiple pointers, and the current pointer is not the active one, we want to shift
					// them offscreen
					//========================================================================================\\

					if(screenPointers.get()[rw] !== undefined){
						screenPointers.get()[rw].style.left = "-100px";
						screenPointers.get()[rw].style.top = "-100px";
					}

				}


				rw += 1;
			
			}

			var ff = rw;

			while(ff < screenPointers.get().length){

				screenPointers.get()[ff].style.top = "-100px";
				screenPointers.get()[ff].style.left = "-100px";

				ff += 1;
			
			}

			if(settings.returnCoordinates === true){
				return cartesianFingers;
			}

		} else if(frame.hands.length < 1) {
			handsLeft = true;

			if(screenPointers.get().length > 0){
				screenPointers.get()[0].style.top = "-100px";
				screenPointers.get()[0].style.left = "-100px";
			}

		}

		if(settings.returnCoordinates === true){
			return [];
		}

	}

	function set(options){

		if(options.event !== undefined){
			eventToDispatch = new Event(options.event);
		}

		if(options.delay !== undefined){
			setDelay(options.delay);
		}

		if(options.threshold !== undefined && typeof options.threshold === "number"){
			threshold = options.threshold;
		}

		if(options.percentToDrop !== undefined && typeof options.percentToDrop === "number"){
			percentToDrop = options.percentToDrop();
		}

		if(options.alwaysReset !== undefined && options.alwaysReset === true || options.alwaysReset === 1){
			reset();
		}

		if(options.displayPointers !== undefined && typeof options.displayPointers === "boolean"){
			screenPointers.display(options.displayPointers);
		}

		if(options.returnCoordinates !== undefined && typeof options.returnCoordinates === "boolean"){
			settings.returnCoordinates = options.returnCoordinates;
		}

	}

	function setDelay(time){

		if(time !== null && time !== undefined && typeof time === "number" && time > -1){
		
			eventDelay = time;
		
		} else {

			console.error("Invalid input");
		
		}

	}

	var screenPointers = (function(){

		var pointers = [],
			displayPointers = true,
			lastCoords = {
				x : undefined,
				y : undefined,
				z : undefined
			};

		var threshold = (function(){

			var moveThreshold = 10;

			function setThreshold(value){
				if(typeof moveThreshold === "number"){
					moveThreshold = value;
				} else {
					console.error("Not a valid value");
				}
			}

			function getThreshold(){
				return moveThreshold;
			}

			return {
				set : setThreshold,
				get : getThreshold
			}

		})();

		function getPointers(){
			return pointers;
		}

		function areWeDisplayingPointers(displayBoolean){

			if(displayBoolean !== undefined && typeof displayBoolean === "boolean"){
				displayPointers = displayBoolean;
			}

			return displayPointers;
		}

		function createScreenPointer(){
			
			var cEl = document.createElement('div');
				cEl.setAttribute('class', 'cursor');

			document.body.appendChild(cEl);

			pointers.push(cEl);

		}

		return{
			get : getPointers,
			display : areWeDisplayingPointers,
			createPointer : createScreenPointer,
			threshold : threshold,
			lastCoords : lastCoords
		}

	})();

	var calibration = (function(){

		function isCalibrated(){
				
			//========================================================================================\\
			// This function checks whether or not we have already calibrated for this screen
			//========================================================================================\\

			if(!isZSet || !isTopSet || !isRightSet || !isBottomSet || !isLeftSet){

				//========================================================================================\\
				// If nothing is set check for stored coordinates. If no coordinates, Return false;
				// If coordinates, set the variables to the stored coordinates, Return true;
				//========================================================================================\\
				if(localStorage.getItem('leapCoords') === null){
					return false;

				} else {

					var storedCoords = JSON.parse(localStorage.getItem('leapCoords'));

					zDepth = storedCoords.z;
					top = storedCoords.topCoords;
					right = storedCoords.rightCoords;
					bottom = storedCoords.bottomCoords;
					left = storedCoords.leftCoords;

					isZSet = isTopSet = isRightSet = isBottomSet = isLeftSet = true;

					return true;

				}

			} else if(isZSet && isTopSet && isRightSet && isBottomSet && isLeftSet && localStorage.getItem('leapCoords') === null){

				//========================================================================================\\
				// If there are coordinates, but none are saved, save them. Return true
				//========================================================================================\\

				var coordsToStore = {z : zDepth, topCoords : top, rightCoords : right, bottomCoords : bottom, leftCoords : left};

				localStorage.setItem('leapCoords', JSON.stringify(coordsToStore));

				return true;

			} else {
				return true;
			}

		}

		function createCalEl(){
			calEl = document.createElement('div');
			calEl.setAttribute('id', 'calEl');

			gained = document.createElement('div');
			gained.setAttribute('id', 'progress');

			calEl.appendChild(gained);

			document.body.appendChild(calEl);

			calEl.style.top = (window.innerHeight / 2) - (calEl.offsetWidth / 2) + "px";
			calEl.style.left = (window.innerWidth / 2) - (calEl.offsetHeight / 2) + "px";

			calEl.style.display = "none";
		}

		function moveCalibrationElement(adjustments){
							
			console.log("Point set. Remove Finger.");
			gained.style.height = "0px";
			calEl.style.display = "none";

			if(adjustments.top !== undefined){
				calEl.style.top = adjustments.top + "px";
			}

			if(adjustments.left !== undefined){
				calEl.style.left = adjustments.left + "px";
			}

			if(adjustments.display !== undefined){
				calEl.style.display = adjustments.display;
			}

			pause = true

			if(adjustments.final !== true){

				setTimeout(function(){

					pause = false;
					calEl.style.display = "block";

				}, delay);
		
			}

		}

		function setDataPercentageAchieved(percent){
			gained.style.height = (calEl.offsetHeight / 100) * percent + "px";
		}

		function calibrate(frame){

			if(pause){
				return;
			}

			var fingers = frame.fingers;

			if(frame.fingers.length > 1){
				return false;
			}

			if(calEl === undefined){

				createCalEl();
				calEl.style.display = "block";

			}

			if(fingers !== null && fingers !== undefined && fingers.length > 0){

				var ay = 0;

				while(ay < 1){
					
					if(!isZSet){

						measure.addPoint({which : "zMeasure", value : fingers[ay].tipPosition[2]})

						if(measure.checkPointProgress({which : "zMeasure"}) > settings.threshold){
							isZSet = true;
							zDepth = measure.getPoint({which : "zMeasure"});

							moveCalibrationElement({top : 0});

						} else {
							setDataPercentageAchieved((measure.checkPointProgress({which : "zMeasure"}) / settings.threshold) * 100)
						}

					} else if(!isTopSet){

						measure.addPoint({which : "topMeasure", value : fingers[ay].tipPosition[1]});

						if(measure.checkPointProgress({which : "topMeasure"}) > settings.threshold){
							isTopSet = true;
							top = measure.getPoint({which : "topMeasure"});
														
							moveCalibrationElement({top : (window.innerHeight / 2) - (calEl.offsetWidth / 2), left : (window.innerWidth - (calEl.offsetWidth / 1))});

						} else {
							setDataPercentageAchieved((measure.checkPointProgress({which : "topMeasure"}) / settings.threshold) * 100);
						}

					} else if(!isRightSet){

						measure.addPoint({which : "rightMeasure", value : fingers[ay].tipPosition[0]});

						if(measure.checkPointProgress({which : "rightMeasure"}) > settings.threshold){
							isRightSet = true;
							right = measure.getPoint({which : "rightMeasure"});
							
							moveCalibrationElement({top : (window.innerHeight - calEl.offsetHeight), left : (window.innerWidth / 2) - (calEl.offsetWidth / 2)})

						} else {							
							setDataPercentageAchieved((measure.checkPointProgress({which : "rightMeasure"}) / settings.threshold) * 100);
						}

					} else if(!isBottomSet){

						measure.addPoint({which : "bottomMeasure", value : fingers[ay].tipPosition[1]});

						if(measure.checkPointProgress({which : "bottomMeasure"}) > settings.threshold){
							isBottomSet = true;
							bottom = measure.getPoint({which : "bottomMeasure"});
							
							moveCalibrationElement({top : (window.innerHeight / 2) - (calEl.offsetWidth / 2), left : 0})

						} else {

							setDataPercentageAchieved((measure.checkPointProgress({which : "bottomMeasure"}) / settings.threshold) * 100);

						}

					} else if(!isLeftSet){

						measure.addPoint({which : "leftMeasure", value : fingers[ay].tipPosition[0]});

						if(measure.checkPointProgress({which : "leftMeasure"}) > settings.threshold){
							isLeftSet = true;
							left = measure.getPoint({which : "leftMeasure"});
							
							moveCalibrationElement({top : ((window.innerHeight / 2) - (calEl.offsetWidth / 2)), left : ((window.innerWidth / 2) - (calEl.offsetWidth / 2)), display : "none", final : true});

						} else {
							var dataGained = (measure.checkPointProgress({which : "leftMeasure"}) / settings.threshold) * 100;

							setDataPercentageAchieved((measure.checkPointProgress({which : "leftMeasure"}) / settings.threshold) * 100);

						}

					}

					ay += 1;

				}

			}

		}

		return{
			isCalibrated : isCalibrated,
			calibrate : calibrate,
			createCalibrationElement : createCalEl
		};

	})();


	function reset(){

		localStorage.clear();
		measure.empty();

		zDepth = top = right = bottom = left = undefined;
		isZSet = isTopSet = isRightSet = isBottomSet = isLeftSet = false;
		
		if(calEl === undefined){
			calibration.createCalibrationElement();
		}

		calEl.style.display = "block";
		calEl.style.left = (window.innerWidth / 2) - (calEl.offsetWidth / 2);

	}

	function currentCoords(){

		return {zDepth : zDepth, top : top, right : right, bottom : bottom, left : left};

	}

	var measure = (function(){

		var measurements = {
			zMeasure : [],
			topMeasure : [],
			rightMeasure : [],
			bottomMeasure :[],
			leftMeasure : []
		};

		function addPoint(point){

			if(point !== undefined && point !== null){

				if(measurements[point.which] !== undefined && point.value !== undefined && typeof point.value === "number"){

					measurements[point.which].push(point.value);
				
				}

			}

		}

		function getPoint(point){
		
			var total = 0;

			for(var c = 0 + Math.floor(((settings.threshold / 100) * settings.percentToDrop)); c < measurements[point.which].length; c += 1){
				total += measurements[point.which][c];
			}
		
			return total / (measurements[point.which].length - Math.floor(((settings.threshold / 100) * settings.percentToDrop)));

		}

		function checkPointProgress(point){

			return measurements[point.which].length;

		}

		function emptyArrays(){

			for(var key in measurements){
				measurements[key] = [];
			}

		}

		return{
			addPoint : addPoint,
			getPoint : getPoint,
			checkPointProgress : checkPointProgress,
			empty : emptyArrays
		};

	})();

	return{
		checkCoords : checkCoordinates,
		calibration : calibration,
		reset : reset,
		currentCoords : currentCoords,
		set : set,
		screenPointers : screenPointers
	};

})();