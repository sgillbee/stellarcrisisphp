Feature: Game Lobby and Player Management
  As a player
  I want to join and manage games
  So that I can participate in Space Blitz matches

  Background:
    Given the Space Blitz application is running
    And I am on the game lobby page

  @smoke
  Scenario: View available games
    When I visit the game lobby
    Then I should see a list of available games
    And each game should display its name and status

  @smoke
  Scenario: Join an existing game
    Given there is an open game "Test Game"
    When I click on "Test Game"
    Then I should be redirected to the game page
    And I should see the game interface

  Scenario: Create a new game
    When I click the "Create Game" button
    And I enter "My New Game" as the game name
    And I click "Create"
    Then I should see "My New Game" in the games list
    And the game status should be "Waiting for players"

  Scenario: Game status updates in real-time
    Given I am viewing the games list
    When another player joins an existing game
    Then the player count should update automatically
    And the game status should reflect the change