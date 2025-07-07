const RepositoryQuery = `
  query($owner: String!, $repo: String!, $number: Int!) {
    repository(owner: $owner, name: $repo){
      pullRequest(number: $number) {
        additions
        deletions
        commits(last: 1) {
          edges {
            node {
              commit {
                oid
              }
            }
          }
        }
        closingIssuesReferences(first: 10) {
          nodes {
            labels(first: 10) {
              edges {
                node {
                  issues(labels: "bug", first: 10) {
                    totalCount
                  }
                }
              }
            }
          }
        }
        author {
          ... on User {
            id
            name
            login
          }
          ... on Organization {
            id
            name
            login
          }
        }
        reviews(first: 100) {
          edges {
            node {
              author {
                ... on User {
                  id
                  name
                }
                ... on Organization {
                  id
                  name
                }
              }
            }
          }
        }
        mergedBy {
          ... on User {
            id
            name
          }
          ... on Organization {
            id
            name
          }
        }
        assignees(first: 100) {
          edges {
            node {
              name
              id
            }
          }
        }
      }
    }
  }
`

module.exports = RepositoryQuery;