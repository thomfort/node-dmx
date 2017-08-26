
# [POST] http://127.0.0.1:8080/animation/office
[
	{"deviceId": 1, "to": {"opacity": 0.25, "color": "pink"}, "duration": 1000, "easing": "linear"},
	{"deviceId": 1, "to": {"opacity": 0}, "duration": 1000, "easing": "outCirc"},
	{"deviceId": 2, "to": {"opacity": 0.25, "color": "orange"}, "duration": 1000, "easing": "linear"},
	{"deviceId": 2, "to": {"opacity": 0}, "duration": 1000, "easing": "outCirc"},
	{"deviceId": 3, "to": {"opacity": 0.25, "color": "#00FF00"}, "duration": 1000, "easing": "linear"},
	{"deviceId": 4, "to": {"opacity": 0.25, "color": "#FF0000"}, "duration": 1000, "easing": "outCirc"}
]


# [POST] http://127.0.0.1:8080/animation/office/led/
{
	"percent": 50,
	"color": "red"
}