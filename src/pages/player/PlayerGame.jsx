import React, { Component } from "react";
import { withRouter } from "react-router";
import { getPlayerSocket } from "../../SocketIoConnection";

class PlayerGame extends Component {
  state = { phase: "WAITING_TO_START", answer: "" };
  // Test state
  // state = {
  //   phase: "STARTED",
  //   promptsToAnswer: [
  //     "The most <i>horrific</i> way to start your day",
  //     "You are having a stroll in the park, only to see BLANK",
  //   ],
  //   currentPromptNumber: 0,
  // };

  constructor(props) {
    super(props);
    this.handleSubmitAnswerClick = this.handleSubmitAnswerClick.bind(this);
    this.handleSubmitVoteClick = this.handleSubmitVoteClick.bind(this);
    this.handleSubmitVoteClick = this.handleSubmitVoteClick.bind(this);
    this.onAnswerChange = this.onAnswerChange.bind(this);
  }

  componentDidMount() {
    const socket = getPlayerSocket();
    if (!socket) {
      // For easier local debugging with live-reload changes
      this.props.history.push("/");
      return;
    }
    socket.on("PLAYER_DISCONNECTED", (playerName) => {
      alert(`${playerName} has disconnected from the game.  Please join a new game to keep playing.`);
      this.props.history.push("/");
    });
    socket.on("START_GAME", (promptsToAnswer) =>
      this.setState({ phase: "STARTED", promptsToAnswer, currentPromptNumber: 0 }),
    );
    socket.on("START_VOTING_PHASE", (onePromptAndAnswers) =>
      this.setState({
        phase: "VOTING",
        prompt: onePromptAndAnswers.prompt,
        votingOptions: onePromptAndAnswers.answers,
      }),
    );
    socket.on("WAIT_FOR_VOTES_ON_YOUR_PROMPT", () => this.setState({ phase: "WAIT_FOR_VOTES_ON_YOUR_PROMPT" }));
  }

  handleSubmitAnswerClick(e) {
    e.preventDefault(); // To prevent page reload on form submit
    if (this.state.answer) {
      getPlayerSocket().emit("SUBMIT_ANSWER", {
        prompt: this.state.promptsToAnswer[this.state.currentPromptNumber],
        answer: this.state.answer,
      });
      if (this.state.currentPromptNumber >= 1) {
        this.setState({ answer: "", phase: "SUBMITTED_ANSWER" });
      } else {
        this.setState({ answer: "", currentPromptNumber: 1 });
      }
    }
  }

  handleSubmitVoteClick(answerVotedFor) {
    getPlayerSocket().emit("SUBMIT_VOTE", { prompt: this.state.prompt, answerVotedFor });
    this.setState({ phase: "WAITING_FOR_NEXT_ROUND" });
  }

  onAnswerChange(event) {
    this.setState({ answer: event.target.value });
  }

  render() {
    switch (this.state.phase) {
      case "STARTED":
        return (
          <form onSubmit={this.handleSubmitAnswerClick}>
            <div>
              <h1 dangerouslySetInnerHTML={{ __html: this.state.promptsToAnswer[this.state.currentPromptNumber] }}></h1>
              <input
                className="form-input player"
                type="text"
                placeholder="Answer Here"
                value={this.state.answer}
                onChange={this.onAnswerChange}
              />
              <br />
            </div>
            <button className="player-button" type="submit">
              Submit
            </button>
          </form>
        );
      case "SUBMITTED_ANSWER":
        return <h1>Waiting for other players to submit their responses...</h1>;
      case "VOTING":
        return (
          <div>
            <h1 dangerouslySetInnerHTML={{ __html: this.state.prompt }}></h1>
            <h2>Which one do you like more?</h2>
            {this.state.votingOptions.map((voteOption) => (
              <button className="player-button" onClick={() => this.handleSubmitVoteClick(voteOption)}>
                {voteOption}
              </button>
            ))}
          </div>
        );
      case "WAITING_TO_START":
        return <h1>Waiting for game to start...</h1>;
      case "WAITING_FOR_NEXT_ROUND":
        return <h1>See the results on the host screen</h1>;
      case "WAIT_FOR_VOTES_ON_YOUR_PROMPT":
        return <h1>See others vote for your answer on the host screen</h1>;
      default:
        throw new Error("Invalid Player State ", this.state.phase);
    }
  }
}

export default withRouter(PlayerGame);
