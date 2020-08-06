process.env.TESTENV = true

let Transaction = require('../app/models/transaction.js')
let User = require('../app/models/user')

const crypto = require('crypto')

let chai = require('chai')
let chaiHttp = require('chai-http')
let server = require('../server')
chai.should()

chai.use(chaiHttp)

const token = crypto.randomBytes(16).toString('hex')
let userId
let transactionId

describe('Transactions', () => {
  const transactionParams = {
    title: '13 JavaScript tricks SEI instructors don\'t want you to know',
    text: 'You won\'believe number 8!'
  }

  before(done => {
    Transaction.deleteMany({})
      .then(() => User.create({
        email: 'caleb',
        hashedPassword: '12345',
        token
      }))
      .then(user => {
        userId = user._id
        return user
      })
      .then(() => Transaction.create(Object.assign(transactionParams, {owner: userId})))
      .then(record => {
        transactionId = record._id
        done()
      })
      .catch(console.error)
  })

  describe('GET /transactions', () => {
    it('should get all the transactions', done => {
      chai.request(server)
        .get('/transactions')
        .set('Authorization', `Token token=${token}`)
        .end((e, res) => {
          res.should.have.status(200)
          res.body.transactions.should.be.a('array')
          res.body.transactions.length.should.be.eql(1)
          done()
        })
    })
  })

  describe('GET /transactions/:id', () => {
    it('should get one transaction', done => {
      chai.request(server)
        .get('/transactions/' + transactionId)
        .set('Authorization', `Token token=${token}`)
        .end((e, res) => {
          res.should.have.status(200)
          res.body.transaction.should.be.a('object')
          res.body.transaction.title.should.eql(transactionParams.title)
          done()
        })
    })
  })

  describe('DELETE /transactions/:id', () => {
    let transactionId

    before(done => {
      Transaction.create(Object.assign(transactionParams, { owner: userId }))
        .then(record => {
          transactionId = record._id
          done()
        })
        .catch(console.error)
    })

    it('must be owned by the user', done => {
      chai.request(server)
        .delete('/transactions/' + transactionId)
        .set('Authorization', `Bearer notarealtoken`)
        .end((e, res) => {
          res.should.have.status(401)
          done()
        })
    })

    it('should be succesful if you own the resource', done => {
      chai.request(server)
        .delete('/transactions/' + transactionId)
        .set('Authorization', `Bearer ${token}`)
        .end((e, res) => {
          res.should.have.status(204)
          done()
        })
    })

    it('should return 404 if the resource doesn\'t exist', done => {
      chai.request(server)
        .delete('/transactions/' + transactionId)
        .set('Authorization', `Bearer ${token}`)
        .end((e, res) => {
          res.should.have.status(404)
          done()
        })
    })
  })

  describe('POST /transactions', () => {
    it('should not POST an transaction without a title', done => {
      let noTitle = {
        text: 'Untitled',
        owner: 'fakedID'
      }
      chai.request(server)
        .post('/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({ transaction: noTitle })
        .end((e, res) => {
          res.should.have.status(422)
          res.should.be.a('object')
          done()
        })
    })

    it('should not POST an transaction without text', done => {
      let noText = {
        title: 'Not a very good transaction, is it?',
        owner: 'fakeID'
      }
      chai.request(server)
        .post('/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({ transaction: noText })
        .end((e, res) => {
          res.should.have.status(422)
          res.should.be.a('object')
          done()
        })
    })

    it('should not allow a POST from an unauthenticated user', done => {
      chai.request(server)
        .post('/transactions')
        .send({ transaction: transactionParams })
        .end((e, res) => {
          res.should.have.status(401)
          done()
        })
    })

    it('should POST an transaction with the correct params', done => {
      let validTransaction = {
        title: 'I ran a shell command. You won\'t believe what happened next!',
        text: 'it was rm -rf / --no-preserve-root'
      }
      chai.request(server)
        .post('/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({ transaction: validTransaction })
        .end((e, res) => {
          res.should.have.status(201)
          res.body.should.be.a('object')
          res.body.should.have.property('transaction')
          res.body.transaction.should.have.property('title')
          res.body.transaction.title.should.eql(validTransaction.title)
          done()
        })
    })
  })

  describe('PATCH /transactions/:id', () => {
    let transactionId

    const fields = {
      title: 'Find out which HTTP status code is your spirit animal',
      text: 'Take this 4 question quiz to find out!'
    }

    before(async function () {
      const record = await Transaction.create(Object.assign(transactionParams, { owner: userId }))
      transactionId = record._id
    })

    it('must be owned by the user', done => {
      chai.request(server)
        .patch('/transactions/' + transactionId)
        .set('Authorization', `Bearer notarealtoken`)
        .send({ transaction: fields })
        .end((e, res) => {
          res.should.have.status(401)
          done()
        })
    })

    it('should update fields when PATCHed', done => {
      chai.request(server)
        .patch(`/transactions/${\transactionId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ transaction: fields })
        .end((e, res) => {
          res.should.have.status(204)
          done()
        })
    })

    it('shows the updated resource when fetched with GET', done => {
      chai.request(server)
        .get(`/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${token}`)
        .end((e, res) => {
          res.should.have.status(200)
          res.body.should.be.a('object')
          res.body.transaction.title.should.eql(fields.title)
          res.body.transaction.text.should.eql(fields.text)
          done()
        })
    })

    it('doesn\'t overwrite fields with empty strings', done => {
      chai.request(server)
        .patch(`/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ transaction: { text: '' } })
        .then(() => {
          chai.request(server)
            .get(`/transactions/${transactionId}`)
            .set('Authorization', `Bearer ${token}`)
            .end((e, res) => {
              res.should.have.status(200)
              res.body.should.be.a('object')
              // console.log(res.body.transaction.text)
              res.body.transaction.title.should.eql(fields.title)
              res.body.transaction.text.should.eql(fields.text)
              done()
            })
        })
    })
  })
})
