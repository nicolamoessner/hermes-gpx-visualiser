$(document).ready(function() {

    for (var i=0; i < sessionStorage.length ; i++) {
        var gpxName = JSON.parse(sessionStorage.getItem(sessionStorage.key(i))).name;
        $("#gpx-files-list").append(
                "<li> \
                <h4><strong>"+gpxName+"</strong></h4> \
                </li>");
    }

    initmap();

    var gpxFileInitial = JSON.parse(sessionStorage.getItem(sessionStorage.key(0)));

    var pointList = [];
    for (var i=0; i < gpxFileInitial.tracks.length; i++) {
        pointList.push(new L.LatLng(gpxFileInitial.tracks[i].lat, gpxFileInitial.tracks[i].lon));
    }
    var firstPolyline = new L.Polyline(pointList, {
        color: "red",
        weight: 2,
        opacity: 0.7,
        smoothFactor: 1
    });
    firstPolyline.addTo(map);

    map.setView(new L.LatLng(gpxFileInitial.tracks[0].lat, gpxFileInitial.tracks[0].lon),15);

});

/*** GPX VISUALISER ***/
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