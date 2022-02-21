const {buildSchema} = require('graphql');

module.exports = buildSchema(`
    type post{
        _id: ID!
        title: String!
        content: String!
        imageUrl: String!
        creator: User!
        createdAt: String!
        updatedAt: String!
    }
    type postsData{
        posts: [post!]!
        totalPosts : Int!
    }
    type User{
        _id: ID!
        name: String!
        email: String!
        password : String
        status: String!
        posts: [post!]!
    }

    input UserInputData{
        email: String!
        name: String!
        password : String!
    }

    input PostInputData{
        title:String!
        content:String!
        imageUrl:String!
    }

    type AuthData{
        token: String!
        userId: String!
    }

    type RootQuery{
        login(email:String!, password: String!):AuthData!
        posts(page:Int!): postsData
        post(id:ID!): post!
        user:User!
    }

    type RootMutation{
        createUser(userInput: UserInputData): User!
        createPost(postInput: PostInputData): post!
        updatePost(id:ID!, postInput: PostInputData): post!
        deletePost(id :ID!): Boolean
        updateStatus(status:String!):User!
    }

    schema {
        query : RootQuery
        mutation : RootMutation
    }
`);