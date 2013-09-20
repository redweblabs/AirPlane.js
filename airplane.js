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
		delay = 2000;

	var threshold = 200,
		percentToDrop = 20;

	var calEl,
		gained;

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
		// This function checks whether or not we have already calibrated for this screen
		//========================================================================================\\

		if(!isZSet || !isTopSet || !isRightSet || !isBottomSet || !isLeftSet){

			//========================================================================================\\
			// If nothing is set check for stored coordinates. If no coordinates, begin calibration
			// If coordinates, set the variables to the stored coordinates
			//========================================================================================\\

			if(localStorage.getItem('leapCoords') === null){

				calibrate(frame);
		
			} else {

				var storedCoords = JSON.parse(localStorage.getItem('leapCoords'));

				zDepth = storedCoords.z;
				top = storedCoords.topCoords;
				right = storedCoords.rightCoords;
				bottom = storedCoords.bottomCoords;
				left = storedCoords.leftCoords;

				isZSet = isTopSet = isRightSet = isBottomSet = isLeftSet = true;

				createCalEl();

			}

		} else if(isZSet && isTopSet && isRightSet && isBottomSet && isLeftSet && localStorage.getItem('leapCoords') === null){

			console.log(2);

			//========================================================================================\\
			// If there are coordinates, but none are saved, save them.
			//========================================================================================\\

			var coordsToStore = {z : zDepth, topCoords : top, rightCoords : right, bottomCoords : bottom, leftCoords : left};

			localStorage.setItem('leapCoords', JSON.stringify(coordsToStore));

		} else {
			
			// console.log(3);

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

						if(pointerDepth - lastZ > moveThreshold && !handsLeft && cartesianX - lastX > moveThreshold || pointerDepth - lastZ > moveThreshold && !handsLeft && cartesianY - lastY > moveThreshold){
							//Right - It's glitched, We're going to keep the pointers where they are

							cartesianX = lastX;
							cartesianY = lastY;
							pointerDepth = lastZ;
							handsLeft = false;

						} else {
							
							lastX = cartesianX;
							lastY = cartesianY;
							lastZ = pointerDepth;

						}

						if(pointers[rw] === undefined){
							createPointer();
						}

						//========================================================================================\\
						// If multiple pointers, we want the option to hide the inactive ones
						//========================================================================================\\

						if(displayPointers){
							pointers[rw].style.opacity = 1;
							pointers[rw].style.left = cartesianX + 50 + "px";
							pointers[rw].style.top = cartesianY + "px";
		
						} else {
		
							pointers[rw].style.opacity = 0;
		
						}

						//========================================================================================\\
						// If we're the closest to the screen, we're going to grab the element at the calculated 
						// coordinates and then if we're close enough dispatch an event to those coordinates.
						// We then set the pause variable to TRUE with a setTimeout so that we don't constantly
						// push the same button. It gives the user time to move and select something else
						//========================================================================================\\

						if(rw === closest && frame.fingers[rw].tipPosition[2] < (zDepth + give)){

							var elementAtCoords = document.elementFromPoint(cartesianX, cartesianY);

							pointers[rw].style.opacity = 1;

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

						if(pointers[rw] !== undefined){
							pointers[rw].style.left = "-100px";
							pointers[rw].style.top = "-100px";
						}

					}


					rw += 1;
				
				}

				var ff = rw;

				while(ff < pointers.length){

					pointers[ff].style.top = "-100px";
					pointers[ff].style.left = "-100px";

					ff += 1;
				
				}

			} else if(frame.hands.length < 1) {
				handsLeft = true;

				if(pointers.length > 0){
					pointers[0].style.top = "-100px";
					pointers[0].style.left = "-100px";
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

		pause = true

		setTimeout(function(){

			pause = false;
			calEl.style.display = "block";

		}, delay);

	}

	function calibrate(frame){

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

					console.log(fingers[ay].tipPosition[2]);

					measure.addPoint({which : "zMeasure", value : fingers[ay].tipPosition[2]})

					if(measure.checkPoint({which : "zMeasure"}) > threshold){
						isZSet = true;
						zDepth = measure.getPoint({which : "zMeasure"});

						moveCalibrationElement({top : 0});

					} else {

						var dataGained = (measure.checkPoint({which : "zMeasure"}) / threshold) * 100;
						gained.style.height = (calEl.offsetHeight / 100) * dataGained + "px";

					}

				} else if(!isTopSet && !pause){

					measure.addPoint({which : "topMeasure", value : fingers[ay].tipPosition[1]});

					if(measure.checkPoint({which : "topMeasure"}) > threshold){
						isTopSet = true;
						top = measure.getPoint({which : "topMeasure"});
													
						moveCalibrationElement({top : (window.innerHeight / 2) - (calEl.offsetWidth / 2), left : (window.innerWidth - (calEl.offsetWidth / 1))});

					} else {
						var dataGained = (measure.checkPoint({which : "topMeasure"}) / threshold) * 100;
						gained.style.height = (calEl.offsetHeight / 100) * dataGained + "px";
					}

				} else if(!isRightSet && !pause){

					measure.addPoint({which : "rightMeasure", value : fingers[ay].tipPosition[0]});

					if(measure.checkPoint({which : "rightMeasure"}) > threshold){
						isRightSet = true;
						right = measure.getPoint({which : "rightMeasure"});
						
						moveCalibrationElement({top : (window.innerHeight - calEl.offsetHeight), left : (window.innerWidth / 2) - (calEl.offsetWidth / 2)})

					} else {
						var dataGained = (measure.checkPoint({which : "rightMeasure"}) / threshold) * 100;
						gained.style.height = (calEl.offsetHeight / 100) * dataGained + "px";
					}

				} else if(!isBottomSet && !pause){

					measure.addPoint({which : "bottomMeasure", value : fingers[ay].tipPosition[1]});

					if(measure.checkPoint({which : "bottomMeasure"}) > threshold){
						isBottomSet = true;
						bottom = measure.getPoint({which : "bottomMeasure"});
						
						moveCalibrationElement({top : (window.innerHeight / 2) - (calEl.offsetWidth / 2), left : 0})

					} else {
						var dataGained = (measure.checkPoint({which : "bottomMeasure"}) / threshold) * 100;
						gained.style.height = (calEl.offsetHeight / 100) * dataGained + "px";
					}

				} else if(!isLeftSet && !pause){

					measure.addPoint({which : "leftMeasure", value : fingers[ay].tipPosition[0]});

					if(measure.checkPoint({which : "leftMeasure"}) > threshold){
						isLeftSet = true;
						left = measure.getPoint({which : "leftMeasure"});
						
						moveCalibrationElement({top : ((window.innerHeight / 2) - (calEl.offsetWidth / 2)), left : ((window.innerWidth / 2) - (calEl.offsetWidth / 2))});

					} else {
						var dataGained = (measure.checkPoint({which : "leftMeasure"}) / threshold) * 100;

						gained.style.height = (calEl.offsetHeight / 100) * dataGained + "px";
					}

				}

				ay += 1;

			}

		}


	}

	function reset(){

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

		var measurements = {
			zMeasure : [],
			topMeasure : [],
			rightMeasure : [],
			bottomMeasure :[],
			leftMeasure : []
		};

		function addPoint(point){

			if(point !== undefined && point !== null){

				console.log(measurements[point.which], point.value, typeof point.value);

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

		function checkPoint(point){

			return measurements[point.which].length;

		}

		function emptyArrays(){
		
			measure.zMeasure = [];
			measure.topMeasure = [];
			measure.rightMeasure = [];
			measure.bottomMeasure = [];
			measure.leftMeasure = [];

		}

		return{
			addPoint : addPoint,
			getPoint : getPoint,
			checkPoint : checkPoint,
			empty : emptyArrays
		};

	})();

	return{
		checkCoords : checkCoordinates,
		calibrate : calibrate,
		measure : measure,
		reset : reset,
		currentCoords : currentCoords,
		showPointers : showPointers,
		setDelay : setDelay,
		createPointer : createPointer
	};

})();