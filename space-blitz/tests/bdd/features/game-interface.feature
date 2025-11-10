Feature: Game Interface and Controls
  As a player in a game
  I want to interact with the game interface
  So that I can make strategic decisions

  Background:
    Given I am logged into Space Blitz
    And I have joined a game

  Scenario: View game board
    When I enter the game
    Then I should see the strategic map
    And I should see my fleet positions
    And I should see available action buttons

  Scenario: Make a move
    Given it is my turn
    When I select a ship
    And I choose a destination
    And I click "Move"
    Then the ship should move to the new location
    And the turn should pass to the next player

  Scenario: View game statistics
    When I click on the "Stats" tab
    Then I should see player rankings
    And I should see fleet compositions
    And I should see turn history

  @flaky
  Scenario: Real-time game updates
    Given I am playing against another player
    When the other player makes a move
    Then I should see the move reflected immediately
    And I should receive a turn notification