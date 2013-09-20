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
		handsLeft = true,
		leniance = 2;

	var threshold = 200,
		percentToDrop = 20;

	var calEl,
		gained;

	var eventDelay = 500;

	var eventToDispatch = new Event('click');

	function checkCoordinates(frame){

		//========================================================================================\\
		// This function checks whether or not we have already calibrated for this screen
		//========================================================================================\\

		if(!isZSet || !isTopSet || !isRightSet || !isBottomSet || !isLeftSet){

			//========================================================================================\\
			// If nothing is set check for stored coordinates. If no coordinates, begin calibration
			// If coordinates, set the variables to the stored coordinates
			//========================================================================================\\

			if(localStorage.getItem('leapCoords') === null){

				calibration.calibrate(frame);
		
			} else {

				var storedCoords = JSON.parse(localStorage.getItem('leapCoords'));

				zDepth = storedCoords.z;
				top = storedCoords.topCoords;
				right = storedCoords.rightCoords;
				bottom = storedCoords.bottomCoords;
				left = storedCoords.leftCoords;

				isZSet = isTopSet = isRightSet = isBottomSet = isLeftSet = true;

				calibration.createElement();

			}

		} else if(isZSet && isTopSet && isRightSet && isBottomSet && isLeftSet && localStorage.getItem('leapCoords') === null){

			//========================================================================================\\
			// If there are coordinates, but none are saved, save them.
			//========================================================================================\\

			var coordsToStore = {z : zDepth, topCoords : top, rightCoords : right, bottomCoords : bottom, leftCoords : left};

			localStorage.setItem('leapCoords', JSON.stringify(coordsToStore));

		} else {

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

				var rw = 0;

				while(rw < frame.fingers.length){

					//========================================================================================\\
					// If this finger is visible and within a given tolerance, then we're going to track it
					// If we were tracking more than one object we wouldn't check for the closest, but here
					// we want only one pointer so we'll ignore the others
					//========================================================================================\\

					if(frame.fingers[rw].tipPosition[2] < (zDepth + (give * leniance))/* && rw === closest*/){

						var thisX = frame.fingers[rw].tipPosition[0],
							thisY = frame.fingers[rw].tipPosition[1];

						var xPer = ((thisX += (0 - left)) / (right - left)) * 100;
						var yPer = ((thisY += (0 - bottom)) / (top - bottom)) * 100;

						var cartesianX = Math.floor(0 + (window.innerWidth / 100 * xPer));
						var cartesianY = Math.floor(window.innerHeight - (window.innerHeight / 100 * yPer));
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
							
							// console.log("Here");

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

							var elementAtCoords = document.elementFromPoint(cartesianX + window.pageXOffset, cartesianY + window.pageYOffset);

							screenPointers.get()[rw].style.opacity = 1;

							if(elementAtCoords !== null && !pause){

								elementAtCoords.dispatchEvent(eventToDispatch);

								(function(){
									
									pause = true

									setTimeout(function(){
										pause = false;
									}, eventDelay);

								})();

							}

						}

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

			} else if(frame.hands.length < 1) {
				handsLeft = true;

				if(screenPointers.get.length > 0){
					screenPointers.get()[0].style.top = "-100px";
					screenPointers.get()[0].style.left = "-100px";
				}

			}

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

		function areWeDisplayingPointers(){

			if(arguments.displayPointers && typeof arguments.displayPointers === "boolean"){
				displayPointers = arguments.displayPointers;
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

		function moveCalibrationElement(position){
							
			console.log("Point set. Remove Finger.");
			gained.style.height = "0px";
			calEl.style.display = "none";
			
			console.log(position);

			if(position.top !== undefined){
				console.log("Well, We got here");
				calEl.style.top = position.top + "px";
			}

			if(position.left !== undefined){
				calEl.style.left = position.left + "px";
			}

			if(position.display !== undefined){
				calEl.style.display = position.display;
			}

			pause = true

			setTimeout(function(){

				pause = false;
				calEl.style.display = "block";

			}, delay);

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

						if(measure.checkPointProgress({which : "zMeasure"}) > threshold){
							isZSet = true;
							zDepth = measure.getPoint({which : "zMeasure"});

							calibration.moveElement({top : 0});

						} else {
							calibration.percent((measure.checkPointProgress({which : "zMeasure"}) / threshold) * 100)
						}

					} else if(!isTopSet){

						measure.addPoint({which : "topMeasure", value : fingers[ay].tipPosition[1]});

						if(measure.checkPointProgress({which : "topMeasure"}) > threshold){
							isTopSet = true;
							top = measure.getPoint({which : "topMeasure"});
														
							calibration.moveElement({top : (window.innerHeight / 2) - (calEl.offsetWidth / 2), left : (window.innerWidth - (calEl.offsetWidth / 1))});

						} else {
							calibration.percent((measure.checkPointProgress({which : "topMeasure"}) / threshold) * 100);
						}

					} else if(!isRightSet){

						measure.addPoint({which : "rightMeasure", value : fingers[ay].tipPosition[0]});

						if(measure.checkPointProgress({which : "rightMeasure"}) > threshold){
							isRightSet = true;
							right = measure.getPoint({which : "rightMeasure"});
							
							calibration.moveElement({top : (window.innerHeight - calEl.offsetHeight), left : (window.innerWidth / 2) - (calEl.offsetWidth / 2)})

						} else {							
							calibration.percent((measure.checkPointProgress({which : "rightMeasure"}) / threshold) * 100);
						}

					} else if(!isBottomSet){

						measure.addPoint({which : "bottomMeasure", value : fingers[ay].tipPosition[1]});

						if(measure.checkPointProgress({which : "bottomMeasure"}) > threshold){
							isBottomSet = true;
							bottom = measure.getPoint({which : "bottomMeasure"});
							
							calibration.moveElement({top : (window.innerHeight / 2) - (calEl.offsetWidth / 2), left : 0})

						} else {

							calibration.percent((measure.checkPointProgress({which : "bottomMeasure"}) / threshold) * 100);

						}

					} else if(!isLeftSet){

						measure.addPoint({which : "leftMeasure", value : fingers[ay].tipPosition[0]});

						if(measure.checkPointProgress({which : "leftMeasure"}) > threshold){
							isLeftSet = true;
							left = measure.getPoint({which : "leftMeasure"});
							
							calibration.moveElement({top : ((window.innerHeight / 2) - (calEl.offsetWidth / 2)), left : ((window.innerWidth / 2) - (calEl.offsetWidth / 2)), display : "none"});

						} else {
							var dataGained = (measure.checkPointProgress({which : "leftMeasure"}) / threshold) * 100;

							calibration.percent((measure.checkPointProgress({which : "leftMeasure"}) / threshold) * 100);

							// gained.style.height = (calEl.offsetHeight / 100) * dataGained + "px";
						}

					}

					ay += 1;

				}

			}

		}

		return{
			calibrate : calibrate,
			moveElement : moveCalibrationElement,
			percent : setDataPercentageAchieved,
			createElement : createCalEl
		};

	})();


	function reset(){

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

			for(var c = 0 + Math.floor(((threshold / 100) * percentToDrop)); c < measurements[point.which].length; c += 1){
				total += measurements[point.which][c];
			}
		
			return total / (measurements[point.which].length - Math.floor(((threshold / 100) * percentToDrop)));

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
		measure : measure,
		reset : reset,
		currentCoords : currentCoords,
		setDelay : setDelay,
		screenPointers : screenPointers
	};

})();