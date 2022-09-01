import React, { Component, Fragment } from "react";
import { connect } from "react-redux";
import { withRouter, Route, Switch, Redirect } from "react-router-dom";
import { Login, Signup } from "./components/AuthForm";
import Home from "./components/Home";
import { me, fetchTasks } from "./store";

/**
 * COMPONENT
 */
class Routes extends Component {
  componentDidMount() {
    this.props.loadInitialData();
  }

  render() {
    const { isLoggedIn, tasks } = this.props;

    return (
      <div>
        {!tasks
          ? "no task"
          : tasks.map((task) => (
              <p className="text-primary" key={task.id}>
                {task.title}
              </p>
            ))}
        {isLoggedIn ? (
          <Switch>
            <Route path="/home" component={Home} />
            <Redirect to="/home" />
          </Switch>
        ) : (
          <Switch>
            <Route path="/" exact component={Login} />
            <Route path="/login" component={Login} />
            <Route path="/signup" component={Signup} />
          </Switch>
        )}
      </div>
    );
  }
}

/**
 * CONTAINER
 */
const mapState = (state) => {
  console.log(state.tasks);
  return {
    tasks: state.tasks,
    // Being 'logged in' for our purposes will be defined has having a state.auth that has a truthy id.
    // Otherwise, state.auth will be an empty object, and state.auth.id will be falsey
    isLoggedIn: !!state.auth.id,
  };
};

const mapDispatch = (dispatch) => {
  return {
    loadInitialData: () => {
      dispatch(me());
      dispatch(fetchTasks());
    },
  };
};

// The `withRouter` wrapper makes sure that updates are not blocked
// when the url changes
export default withRouter(connect(mapState, mapDispatch)(Routes));
