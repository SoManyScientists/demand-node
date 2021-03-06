var RoomController = Fidel.ViewController.extend({
  events: {
    playTrackAction: 'click ol li .play', //delegateActions won't work here - bug in fidel
    placeBid: 'click button.bidSubmit',
    voteUp: 'click a.like',
    voteDown: 'click a.hate'
  },
  init: function() {
    var self = this;
    this.isDJ = false;
    this._playerReady = false;
    this.player = new Player(this.playbackToken);
    this.player.on('ready', this.proxy(this.onPlayerReady));
    this.searchController = new SearchController ({ el: $('#search') });
    this.searchController.on('select', this.proxy(this.trackSelected));
  },
  onPlayerReady: function() {
    this._playerReady = true;
    this.initSocket();
  },
  initSocket: function() {
    var self = this;
    this.socket = io.connect('http://'+document.location.hostname); //TODO
    this.chat = new ChatController({ el: this.find("#chat"), socket: this.socket });
    this.userList = new UserListController({ el: this.find("#userlist"), socket: this.socket });
    this.socket.on('unsetDJ', this.proxy(this.unsetDJ));
    this.socket.on('setDJ', this.proxy(this.setDJ));
    this.socket.on('djPlayedTrack', this.proxy(this.djPlayedTrack));
    this.socket.emit('join', this.room, window.firstName, window.userId);
    this.socket.on('bidPlaced', this.proxy(this.updateBid));
    this.socket.on('resetBid', this.proxy(this.resetBid));
    this.socket.on('updatePoints', this.proxy(this.updatePoints));
    this.socket.on('updateVotes', this.proxy(this.updateVotes));
    this.on('songEnded', function(e) {
      self.unsetDJ();
      self.socket.emit('songEnded');
    });
  },
  djPlayedTrack: function(trackKey) {
    if (!this.isDJ) {
      //console.log("dj played track", trackKey);
      this.playTrack(trackKey);
    }
  },
  setDJ: function(userId) {
    //console.log("set dj", userId);
    if(window.userId != userId) {
      this.isDJ = false;
      return;
    }

    // console.log("set as DJ");
    this.isDJ = true;
    this.playTrack(this.selectedTrack);

    $('#bidder').hide();
    $('#listener').hide();
    $('#selectedTrack').hide();
    $('#dj').show('block');
  },
  unsetDJ: function() {
    // console.log('unsetting dj');
    this.isDJ = false;
    $('#bidder').show('block');
    $('#listener').show('block');
    $('#selectedTrack').show('block');
    $('#dj').hide();
    $('#nowPlaying').hide();
    $('.score').html(0);
  },
  trackSelected: function(trackKey) {
    this.selectedTrack = trackKey;
    var self = this;
    services.rdio.getTrackInfo(trackKey, function(data) {
      // console.log(data);
      var tmp = $("#tmpSelectedTrack").html();
      var html = str.template(tmp, { track: data });
      self.find("#selectedTrack").html(html);
      self.find("#selectedTrack").show('block');
    });
  },
  playTrackAction: function(e) {
    var trackKey = e.target.getAttribute('data-trackkey');
    // console.log(trackKey);
    this.playTrack(trackKey);
  },
  playTrack: function(trackKey) {
    var self = this;
    if (this.isDJ)
      this.socket.emit('playTrack', trackKey);
    this.player.play(trackKey);
    services.rdio.getTrackInfo(trackKey, function(data) {
      // console.log(data);
      var tmp = $("#tmpNowPlaying").html();
      var html = str.template(tmp, { track: data });
      self.find("#nowPlaying").html(html);
      self.find("#nowPlaying").show('block');

      if(self.isDJ) $('.noDJ').remove();
    });
  },
  placeBid: function(e) {
    e.preventDefault();
    var bidInput = $('.bidAmount')[0],
        bidAmount = bidInput.value;
    if(bidAmount < 0) return; //NOPE.AVI

    this.socket.emit('placeBid', bidAmount);

    bidInput.disabled = true;
    e.target.disabled = true;
    this.find('button.bidSubmit').hide();
  },
  resetBid: function() {
    $('.bidAmount')[0].disabled = false;
    $('.bidSubmit')[0].disabled = false;
    $('.topBid').html('0');
    this.find('button.bidSubmit').show();
  },
  updateBid: function(total) {
    $('.topBid').html(total);
  },
  updatePoints: function(points) {
    // console.log('update points', points);
    $('.points').html(points);
  },
  updateVotes: function(votes) {
    // console.log('updating score', votes);
    $('.score').html(votes);
  },
  voteUp: function(e) {
    e.preventDefault();
    this.socket.emit('vote', 1);
    $('.noDJ').remove();
  },
  voteDown: function(e) {
    e.preventDefault();
    this.socket.emit('vote', -1);
    $('.noDJ').remove();
  }
});
