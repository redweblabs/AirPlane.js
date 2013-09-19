#airPlane.js
#####airPlane.js is a Javascript library that uses the Leap Motion to create touch interactions within a browser.

###Usage

airPlane is pretty simple to use. In order to use it, you'll need the Leap Motion Javascript library and the Leap Motion software installed on your Linux/Mac/Windows box. Firstly, create a Leap Motion object like so...

'''javascript
var leap = new Leap.Controller();

'''

Then, we want to connect to the websocket connection the Leap Motion software opens for us.

'''javascript

leap.on('animationFrame', function(frame){
	
	airPlane(frame);

});

leap.connect();
	
'''

You'll see that we pass the frame object through to airPlane. If the screen has not already been calibrate for usage with the library it will show a calibration element in the center of the screen.

Touch your finger to the screen in the middle of the calibration elements until they completely fill white. The first measure meant is the Z-depth of your screen from the Leap Motion, the rest are the bounds (top/left/bottom/right) of the windows visible area. After the last measurement has been taken whenever you put your finger to the screen a click event will be dispatched to the element at that point, The next update will let you set the event you want to be dispatched.

If the Leap motion has already been configured for this site, it will skip the calibration step and you'll be able to interact straight away.