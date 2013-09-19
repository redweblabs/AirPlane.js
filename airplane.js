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

					measure.setZ(fingers[ay].tipPosition[2]);

					if(measure.setZ() > threshold){
						isZSet = true;
						console.log("Hit Z 	threshold");
						console.log("measure.setZ: %f;", measure.getZ());
						zDepth = measure.getZ();

						(function(){
							
							console.log("Point set. Remove Finger.");
							gained.style.height = "0px";
							calEl.style.display = "none";
							
							pause = true

							setTimeout(function(){
								pause = false;
								calEl.style.display = "block";

								calEl.style.top = "0px";
								
							}, delay);

						})();

					} else {

						var dataGained = (measure.setZ() / threshold) * 100;
						gained.style.height = (calEl.offsetHeight / 100) * dataGained + "px";

					}

				} else if(!isTopSet && !pause){

					measure.setTop(fingers[ay].tipPosition[1]);

					if(measure.setTop() > threshold){
						isTopSet = true;
						console.log("measure.getTop: %f;", measure.getTop());
						top = measure.getTop();
						
						(function(){
							
							console.log("Point set. Remove Finger.");
							gained.style.height = "0px";
							calEl.style.display = "none";

							pause = true

							setTimeout(function(){
								pause = false;
								calEl.style.display = "block";

								calEl.style.top = (window.innerHeight / 2) - (calEl.offsetWidth / 2) + "px";
								calEl.style.left = (window.innerWidth - (calEl.offsetWidth / 1)) + "px";;
								
							}, delay);

						})();

					} else {
						var dataGained = (measure.setTop() / threshold) * 100;
						gained.style.height = (calEl.offsetHeight / 100) * dataGained + "px";
					}

				} else if(!isRightSet && !pause){

					measure.setRight(fingers[ay].tipPosition[0]);

					if(measure.setRight() > threshold){
						isRightSet = true;
						console.log("measure.getRight: %f;", measure.getRight());
						right = measure.getRight();
						
						(function(){
							
							console.log("Point set. Remove Finger.");
							gained.style.height = "0px";
							calEl.style.display = "none";

							pause = true

							setTimeout(function(){
								pause = false;
								calEl.style.display = "block";

								calEl.style.top = (window.innerHeight - calEl.offsetHeight) + "px";
								calEl.style.left = (window.innerWidth / 2) - (calEl.offsetWidth / 2) + "px";
								
							}, delay);

						})();

					} else {
						var dataGained = (measure.setRight() / threshold) * 100;

						gained.style.height = (calEl.offsetHeight / 100) * dataGained + "px";
					}

				} else if(!isBottomSet && !pause){

					measure.setBottom(fingers[ay].tipPosition[1]);

					if(measure.setBottom() > threshold){
						isBottomSet = true;
						console.log("measure.getBottom: %f;", measure.getBottom());
						bottom = measure.getBottom();
						
						(function(){
							
							console.log("Point set. Remove Finger.");
							gained.style.height = "0px";
							calEl.style.display = "none";

							pause = true

							setTimeout(function(){
								pause = false;
								//Set Calibration element
								calEl.style.top = (window.innerHeight / 2) - (calEl.offsetWidth / 2) + "px";
								calEl.style.left = 0 + "px";
								calEl.style.display = "block";
							}, delay);

						})();

					} else {
						var dataGained = (measure.setBottom() / threshold) * 100;
						gained.style.height = (calEl.offsetHeight / 100) * dataGained + "px";
					}

				} else if(!isLeftSet && !pause){

					measure.setLeft(fingers[ay].tipPosition[0]);

					if(measure.setLeft() > threshold){
						isLeftSet = true;
						console.log("measure.getLeft: %f;", measure.getLeft());
						left = measure.getLeft();
						
						(function(){
							
							console.log("Point set. Remove Finger.");
							gained.style.height = "0px";
							calEl.style.display = "none";

							pause = true

							setTimeout(function(){
								pause = false;
					
								calEl.style.top = ((window.innerHeight / 2) - (calEl.offsetWidth / 2)) + "px";
								calEl.style.left = ((window.innerWidth / 2) - (calEl.offsetWidth / 2)) + "px";
					
							}, delay);

						})();

					} else {
						var dataGained = (measure.setLeft() / threshold) * 100;

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

		var zMeasure = [],
			topMeasure = [],
			rightMeasure = [],
			bottomMeasure = [],
			leftMeasure = [];

		function setZ(coords){

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

			for(var d = 0 + Math.floor(((threshold / 100) * percentToDrop)); d < topMeasure.length; d += 1){
				total += topMeasure[d];
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

			for(var e = 0 + Math.floor(((threshold / 100) * percentToDrop)); e < rightMeasure.length; e += 1){
				total += rightMeasure[e];
			}

			return total / (rightMeasure.length - Math.floor(((threshold / 100) * percentToDrop)));

		}

		function setBottom(coords){

			if(coords !== undefined & coords !== null){
				bottomMeasure.push(coords);
			}

			return bottomMeasure.length;

		}

		function getBottom(){

			var total = 0;

			for(var f = 0 + Math.floor(((threshold / 100) * percentToDrop)); f < bottomMeasure.length; f += 1){
				total += bottomMeasure[f];
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

			for(var g = 0 + Math.floor(((threshold / 100) * percentToDrop)); g < leftMeasure.length; g += 1){
				total += leftMeasure[g];
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