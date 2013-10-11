#airPlane.js
#####airPlane.js is a Javascript library that uses the Leap Motion to create touch interactions within a browser.

###Usage

airPlane is pretty simple to use. In order to use it, you'll need the Leap Motion Javascript library and the Leap Motion software installed on your Linux/Mac/Windows box. Firstly, add the CSS file to your markup...

```HTML
	<link rel="stylesheet" type="text/css" href="airplane.css">
```

Then create a Leap Motion object like so...

```javascript
	var leap = new Leap.Controller();
```

After this, we want to connect to the websocket connection the Leap Motion software opens for us.

```javascript
    leap.on('animationFrame', function(frame){
	
        airPlane(frame);

	});

    leap.connect();
```

You'll see that we pass the frame object through to airPlane. If the screen has not already been calibrate for usage with the library it will show a calibration element in the center of the screen.

Touch a single finger to the screen in the middle of the calibration elements until they completely fill white. The first measure taken is the Z-depth of your screen from the Leap Motion, the rest are the bounds (top/left/bottom/right) of the windows visible area. After the last measurement has been taken whenever you put your finger to the screen a click event (an event that you can set) will be dispatched to the element at that point. After the caliration process has been completed the coordinates stored will be saved in localStorage under the key 'leapCoords'.

If the Leap motion has already been configured for this site, it will skip the calibration step and you'll be able to interact straight away.

###Methods

####airPlane.checkCoordinates(FRAME)

This is the main function that you should call in the animation frame sent from the Leap. This function checks if the screen has been calibrated for use and if so, calculates (based on stored coordinates) where on the screen the user is touching.

####airPlane.calibration.isCalibrated()
######returns true || false

This isCalibrated method is called to check whether or not there are coordinates available for airPlane to use with touch interaction. The function will check the present state of calibration. If the screen has not been calibrated for, it will check for coordinates that can be used in localStorage. If it finds coordinates, it will set them and return true and set all booleans/checks accordingly. If no usable coordinates are found this function will return false. This method will continue to return false until Z/Top/Right/Bottom/Left coordinates are all set.

####airPlane.calibration.calibrate(FRAME)
Calibrate works through the coordinates needed for touch interaction and measures the location of the index finger in space. This is done by passing the fingers coordinates through to the private measure.addPoint function and then checking how many coordinates have been stored in an array relevant to that coordinate. It will call measure.checkPointProgress() to get the length of that array, if the array is longer than the threshold set (threshold being the number of coordinates we set before we consider it static) then measure.getPoint() will be called which will drop the first 20% of measurements (because people are still moving their finger at that point) it will return the average of all results stored.

When all coordinates have been set airPlane.calibration.isCalibrated() will return true and checkCoordinates will start calculating where on the screen your fingers are.

####airPlane.reset()
This will reset all of the coordinate values to their original settings and will clear stored coordinates from localStorage.

####airPlane.currentCoords()
Returns an object with the current coordinates

####airPlane.set({options})
Allows the user to set certain options that are used in airPlanes execution.
	
####Valid Options
```javascript
	airPlane.set({
		customEvent : STRING, //Can be any custom event keyword
		delay : INT, //How long the delay should be between event dispatches in milliseconds
		threshold : INT, //The number of results the calibrate method needs to take before it considers that point set
		percentToDrop : FLOAT, //How many of those results should be ignored (from 0)
		alwaysReset : BOOLEAN, //Should airPlane always recalibrate on load
		displayPointers : BOOLEAN, //Should the white pointers that appear as a finger approaches the screen be shown
		returnCoordinates : BOOLEAN //Will return the coordinates calculated for all of the fingers on the screen
	});
```

returnCoordinates replaces the functionality that was found in airplane.mod.js. If the boolean is set to true then after all fingers have been iterated through, an array with the cartesian coordinates will be returned for usage like so...

```javascript
	leap.on('animationFrame', function(frame){
	
        var coords = airPlane(frame);

        console.log(coords) // Will result in [] or [{x : X, y : Y, z : Z}] for each finger

	});
```