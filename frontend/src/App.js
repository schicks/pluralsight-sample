import React, { Component } from 'react';
import Table from 'react-table';
import logo from './logo.svg';
import './App.css';

class App extends Component {
  state = {
    data:[],
    pages:-1,
    loading:true,
    page:1,
  }

  constructor(props) {
    super(props);
    this.fetchData = this.fetchData.bind(this);
  }

  fetchData(state, instance) {
    this.setState({loading:true});
    console.warn(state)
    const query = this.queryString(state)
    Promise.all([
      fetch(`/rest/api/questions?${query}`).then(a => a.json()),
      fetch(`/rest/api/questions/count?${query}`).then(a => a.json())
    ]).then(([data, {count}]) => {
      console.warn(data)
      this.setState({
        data,
        pages: Math.ceil(count/10),
        loading:false
      })
    })
  }

  queryString({page,sorted, filtered}) {
    return [
      page ? `offset=${(page)*10}` : null,
      ...filtered.map(({id, value}) => `filter[${id}]=${value}`),
      ...sorted.map(({id, desc}) => `sort[key]=${id}&sort[order]=${desc ? 'desc' : 'asc'}`)
    ].filter(a => a).join('&')
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">Pluralsight Demo Data</h1>
        </header>
        <Table
          columns={[
            {Header:'Question', accessor:'question'},
            {Header:'Answer', accessor:'answer'},
            {Header:'Distractors', id:'distractors', accessor: r => r.distractors.join(',')},
          ]}
          manual
          filterable
          defaultPageSize={10}
          onFetchData={this.fetchData}
          data={this.state.data}
          pages={this.state.pages}
          loading={this.state.loading}
          showPageJump={false}
        />
      </div>
    );
  }
}

export default App;
