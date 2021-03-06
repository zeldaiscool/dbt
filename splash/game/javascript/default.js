$(function(){
  // Scope Globals
  var id = Math.floor( Math.random() * 9999 )
  var moving = false;
  var drawing = false;
  // Socket
  var client = io.connect( window.location.host );
  
  // User Interface
  var ui = {
    map: (function(){
      var div =  $( '<div />' )
         .attr( 'id', 'map' )
         .appendTo( $('body') );
      return div;
    })()
  };

  // Map
  var map = new google.maps.Map(ui.map[0], {
    center: new google.maps.LatLng(10.5526, -61.3152),
    zoom: 9,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  });

  // Map Event Triggers
  google.maps.event.addListener(map, 'dragend', function() {
    client.emit( 'Sync Map', {
      lat: map.getCenter().Ya,
      lon: map.getCenter().Za,
      zoom: map.getZoom(),
      mapType: map.getMapTypeId(),
      id: id
    });
  });

  // Drawing Manager
  var drawingManager = new google.maps.drawing.DrawingManager({
    drawingControl: true,
    drawingControlOptions: {
      position: google.maps.ControlPosition.TOP_CENTER,
      drawingModes: [
        google.maps.drawing.OverlayType.MARKER,
        google.maps.drawing.OverlayType.POLYGON,
        google.maps.drawing.OverlayType.POLYLINE,
      ]
    },
    markerOptions: {
      icon: 'textures/map_icon_text.png'
    },
    polygonOptions: {
      fillColor: '#aaaaff',
      fillOpacity: 0.5,
      strokeWeight: 1,
      clickable: true,
      zIndex: 1
    }
  });
  drawingManager.setMap(map);

  // Map Event Recievers bound to clent emitters
  google.maps.event.addListener(drawingManager, 'markercomplete', function(marker){
    var msg = prompt('Add a Message', '');
    client.emit( 'Add Marker', {
      lat: marker.position.Ya,
      lon: marker.position.Za,
      message: msg,
      id: id
    });

    var infowindow = new google.maps.InfoWindow({content: msg});
    google.maps.event.addListener(marker, 'mouseover', function(){
      infowindow.open(map, marker);
    });

    google.maps.event.addListener(marker, 'mouseout', function(){
      infowindow.close(map, marker);
    });
  });
  google.maps.event.addListener(drawingManager, 'polygoncomplete', function(polygon){
    var vertexes = []
    var vertextList = polygon.getPaths().getArray()[0].b;
    for(var i=0;i<vertextList.length; i++){
      vertexes.push( {lat:vertextList[i].Ya, lon:vertextList[i].Za} )
    }
    client.emit( 'Add Polygon', {
      paths: vertexes,
      id: id
    });
  });
  google.maps.event.addListener(drawingManager, 'polylinecomplete', function(polyline){
    var vertexes = []
    var vertexList = polyline.getPath().getArray();
    for(var i=0;i<vertexList.length;i++){
      vertexes.push( {lat:vertexList[i].Ya,lon:vertexList[i].Za} );
    } 
    client.emit( 'Add Polyline', {
      paths: vertexes,
      id: id
    });
  });

  client.on( 'Add Polyline', function( data ){
    if(data.id === id) return;
    var vertexes = [];
    for(var i=0;i<data.paths.length;i++){
      vertexes.push( new google.maps.LatLng(data.paths[i].lat, data.paths[i].lon) );
    }
    console.log(data);
    var polyline = new google.maps.Polyline({
      map: map,
      path: vertexes
    });
  });

  client.on( 'Add Polygon', function( data ){
    if(data.id === id) return;
    var vertexes = [];
    for(var i=0;i<data.paths.length; i++){
      vertexes.push( new google.maps.LatLng(data.paths[i].lat, data.paths[i].lon) );
    }

    var polygon = new google.maps.Polygon({
      map: map,
      fillColor: '#0000ff',
      fillOpacity: 0.5,
      strokeWeight: 1,
      paths: vertexes
    });
  });

  client.on( 'Add Marker', function( data ){
    if(data.id === id) return;
    var markerPos = new google.maps.LatLng(data.lat, data.lon);
    var marker = new google.maps.Marker({
      position: markerPos,
      map: map,
      icon: 'textures/map_icon_text.png',
      animation: google.maps.Animation.DROP,
      title: "From: "+id
    });
    var infowindow = new google.maps.InfoWindow({
      content: data.message
    });

    google.maps.event.addListener(marker, 'mouseover', function(){
      infowindow.open(map, marker);
    });

    google.maps.event.addListener(marker, 'mouseout', function(){
      infowindow.close(map, marker);
    });
    console.log( data );
  });
  client.on( 'Sync Map', function( data ){
    if(data.id === id) return;
    map.panTo( new google.maps.LatLng(data.lat, data.lon) );
    map.setZoom( data.zoom );
    map.setMapTypeId( data.mapType );
    console.log( data );
  });

  // Client Events
  client.on( 'Connected' , function( data ){
    console.log( 'Connected:', data );
  });
  client.on( 'Disconnected', function( data ){
    console.log( 'Disconnected:', data );
  });
});
