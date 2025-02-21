/**
 * game-room-display.js
 * 
 * Manages display elements on the Game Room view.
 */

$(function () {
    var gameId = $("#gameId").attr("data"),
        userName = $("#userName").attr("data"),
        playerList = $("#room-options"),
        readyState = false,
        classSelected = false,
        oldNumber = 0,
        newNumber = 0,
        characterChoice = "",
        kickOptions = "",
        inGame = false,
        
        alert = function (message, onclose) {
          $("#alert-popup")
            .text(message)
            .dialog("close")
            .dialog({
              width: 400,
              resizable: false,
              modal: true,
              close: onclose || function () {},
              buttons: { "Ok": function() { $(this).dialog("close"); } }
            });
        },
        
        // function to grab the game state
        getGamestate = function () {
          $.ajax({
            type: 'GET',
            url: '/gamestate/' + gameId,
            data: {
              player : userName,
              ready : readyState,
              character : characterChoice
            },
            success: function (data) {
              if (!data) {
                alert("Game-room closed. Redirecting to Lobby.", function () {
                  window.location = '../../lobby';
                });
                return;
              }
              newNumber = data.players.length;
              if (data.environment.readyState) {
                window.location = '/game/' + gameId;
              } else {
                gamestate = data;
                // Only wipe the list if we have players leave / join
                if (oldNumber !== newNumber) {
                  // Clear players in list
                  playerList.html("");
                }
                
                // List a new element for each player in the room
                for (var i = 0; i < gamestate.players.length; i++) {
                  var currentPlayer = gamestate.players[i],
                      playerAccent = "",
                      playerStatus = "room-player-list";
                      
                  if (currentPlayer.name === userName) {
                    inGame = true;
                  }
                  
                  if (gamestate.players[i].readyState === "ready") {
                    playerStatus += " room-player-ready";
                    if (!readyState) {
                      $("#readyButton").fadeTo(250, 0.25).fadeTo(250, 1);
                    }
                  }
                  
                  // Only add the player items if we have players leave / join
                  if (oldNumber !== newNumber) {
                    // Accent the current player in the lobby
                    if (currentPlayer.name === userName) {
                      playerAccent = 'class="currentPlayer"';
                    }
                  
                    // Add the HTML to the list area
                    playerList.append(
                      '<div id="' + currentPlayer.name + '-listing" class="' + playerStatus + '">'
                      + '<strong ' + playerAccent + '>' + currentPlayer.name + '</strong><span class="class-selection"></span></div>'
                    );
                  }
                  
                  // Then, update the necessary list components
                  $("#" + currentPlayer.name + "-listing").toggleClass("room-player-ready", currentPlayer.readyState === "ready");
                  
                  if (currentPlayer.character !== null) {
                    $("#" + currentPlayer.name + "-listing > .class-selection")
                      .html("<img class='class-icon class-selected' src='../assets/icons/" + currentPlayer.character + "Icon.png'></img>");
                  }
                }
                
                if (!inGame) {
                  alert("You cannot join games by URL. Use the lobby functions! (If you've reached this message in error, try again.)", function () {
                    window.location = '../../lobby';
                  });
                  return;
                }
                
                oldNumber = newNumber;
              }
            },
            error: function (jqXHR, textStatus, errorThrown) {
              console.log(jqXHR);
              console.log(textStatus);
              console.log(errorThrown);
            },
            dataType: 'json',
            contentType: 'application/json'
          });
        },
        
        // Set the handlers for the class selection
        buttonizeClasses = function () {
          $("#class-options").children().each(function () {
            $(this).click(function () {
              characterChoice = $(this).children(":nth-child(1)").attr("id");
              $(this).siblings().each(function () {$(this).removeClass("class-selected")});
              $(this).addClass("class-selected");
              classSelected = true;
              getGamestate();
            });
          });
        },
        
        // Remove class selection handlers to lock them after readying up
        lockClasses = function() {
          $("#class-options").children().each(function () {
            $(this).unbind("click");
          });
        };
        
    // Pull the current gamestate on entrance
    getGamestate();
    
    // Update the room every 2 seconds to reflect players leaving / staying
    window.setInterval(getGamestate, 2000);
    
    buttonizeClasses();
    
    // Set the ready state button
    $("#readyButton")
      .button()
      .click(function () {
      if (readyState !== "ready") {
        if (!classSelected) {
          alert("You must choose a class before readying up!");
          return;
        }
        lockClasses();
        readyState = "ready";
        getGamestate();
        $("#readyButton").attr("value", "I'm Not Ready!");
      } else {
        buttonizeClasses();
        readyState = "notReady";
        $("#readyButton").attr("value", "I'm Ready!");
        getGamestate();
      }
    });
    
});
