$(document).ready(function() {

    /* Create a div block in the html document, and add the list of filenames. */ 
    for (var i=0; i < sessionStorage.length ; i++) {
        var gpxName = JSON.parse(sessionStorage.getItem(sessionStorage.key(i))).name;
        $("#gpx-files-list").append(
                "<li> \
                <h4><strong>"+gpxName+"</strong></h4> \
                </li>");
    }

    /* Initialise the map then draw the first (possibly only) file uploaded b the user. */
    initmap();
    var gpxFileInitial = JSON.parse(sessionStorage.getItem(sessionStorage.key(0)));
    gpxMapRender(gpxFileInitial.name);

});


/*** Initialise the leaflet map. ***/
var map;
var ajaxRequest;
var plotlist;
var plotlayers=[];
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


/* Draws the route gpxName on the map using leaflet. */
function gpxMapRender(gpxName) {
    
    /* Load the file with track name gpxName from sessionStorage. */
    var gpxFile = JSON.parse(sessionStorage.getItem(gpxName));

    /* Go through each track segment and draw a Polyline on the map */
    for (seg of gpxFile.trksegs) {
        /* Create an empty list then add to it the coordinates of each track point in the segment. */
        var pointList = [];
        for (var i=0; i < seg.length; i++) {
            pointList.push(new L.LatLng(seg[i].lat, seg[i].lon));
        }

        /* Draw poplyline for current track segment. */
        var firstPolyline = new L.Polyline(pointList, {
            color: "red",
            weight: 2,
            opacity: 0.7,
            smoothFactor: 1
        });
        firstPolyline.addTo(map);
    }
    /* Set the map to view the starting position of the gpx file. */
    map.setView(new L.LatLng(gpxFile.trksegs[0][0].lat, gpxFile.trksegs[0][0].lon),15);
}
