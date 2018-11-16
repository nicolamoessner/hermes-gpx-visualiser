$(document).ready(function() {
    /* Create a div block in the html document, and add the list of filenames. */
    for (var i=0; i < sessionStorage.length ; i++) {
        var gpxName = JSON.parse(sessionStorage.getItem(sessionStorage.key(i))).name;
        var id = "tab_id_" + i;
        $("#gpx-files-list").append(
            '<a class="list-group-item list-group-item-action" id="'+id+'" href="#" \
            onclick="routeSelected('+i+')" role="tab" aria-controls="home">'+gpxName+' </a>');
    }

    /* Initialise the map then draw the first (possibly only) file uploaded by the user. */
    initmap();
    // var gpxFileInitial = JSON.parse(sessionStorage.getItem(sessionStorage.key(0)));
    gpxMapRender(0);
    $("#tab_id_0").addClass("active");
});

/* Initialise an array with 10 colors for the different files. */
var colors = ["#cc0000", "#00cc00", "#0033cc", "#cc6600", "#0099cc", "#9900cc", "#cccc00", "#00cc99", "#cc0066", "#99cc00"]

/* Initialise variable hrIcon to store the info on the icon image. */
var hrIcon = L.icon({
    iconUrl: './img/hr.png',
    iconSize:     [20, 20], // size of the icon
    iconAnchor:   [10, 20], // point of the icon which will correspond to marker's location
    popupAnchor:  [0, -20] // point from which the popup should open relative to the iconAnchor
});


/*** Initialise the leaflet map. ***/
var map;
var ajaxRequest;
var plotlist;
var plotlayers=[];
var markerGroup;
function initmap() {
    // set up the map
    map = new L.Map('map');

    // create the tile layer with correct attribution
    var osmUrl='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    var osmAttrib='Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors';
    var osm = new L.TileLayer(osmUrl, {minZoom: 6, maxZoom: 17, attribution: osmAttrib});
    map.addLayer(osm);
}
/***********************************/

function routeSelected(i) {
    /* Build id of the tab divs */
    var id = "tab_id_" + i;
    var gpxKey = sessionStorage.key(i);

    /* Check if the tab is already selected */
    if ($("#"+id+"").hasClass("active")) {
        /* Remove active class form tab */
        $("#"+id+"").removeClass("active");
        /* Get the selected polygon and remove it from the map. */
        for (var j = 0; j < plotlayers.length; j++) {
            if (plotlayers[j].options.id == i) {
              plotlayers[j].remove(map);
            }
        }
		/* Removes the icons from the map. */
		map.removeLayer(markerGroup)
    } else {
        $("#"+id+"").addClass("active");
        gpxMapRender(i);
    }
}

/* Draws the route gpxKey on the map using leaflet. */
function gpxMapRender(index) {
    /* Load the file with the given index from sessionStorage. */
    var gpxFile = JSON.parse(sessionStorage.getItem(sessionStorage.key(index)));

    /* Load the file with track name gpxKey from sessionStorage. */
    // var gpxFile = JSON.parse(sessionStorage.getItem(gpxKey.name+" "+gpxKey.time));
	markerGroup = L.layerGroup().addTo(map);
    /* Go through each track segment and draw a Polyline on the map */
    for (seg of gpxFile.trksegs) {
        /* Create an empty list then add to it the coordinates of each track point in the segment. */
        var pointList = [];
        for (var i=0; i < seg.length; i++) {
            pointList.push(new L.LatLng(seg[i].lat, seg[i].lon));
			/* Add a heart rate icon for every num entry. */
			if (i % 50 == 0){
				L.marker([seg[i].lat,seg[i].lon], {icon: hrIcon}).addTo(markerGroup).bindPopup("Heart rate: "+seg[i].ext.hr);
			}
        }

        /* Draw poplyline for current track segment. */
        var firstPolyline = new L.Polyline(pointList, {
            id: index, // Same index for multiple segments!!!
            color: colors[index],
            weight: 2,
            opacity: 0.7,
            smoothFactor: 1
        });
        firstPolyline.addTo(map);
        plotlayers.push(firstPolyline); // Add ployline layer to list of al layers.
		
    }

    /* Set the map to view the starting position of the gpx file. */
    map.setView(new L.LatLng(gpxFile.trksegs[0][0].lat, gpxFile.trksegs[0][0].lon),15);
}
