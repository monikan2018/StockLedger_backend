const mongoose = require('mongoose')

const transactionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
   transaction_type: {
    type: String,
    required: true
  },
   exchange: {
    type: String,
    required: true
  },
  quantity:{
    type: Number,
    required:true
  },
    date:{
      type:Date,
      required:true
  },
   price:{
     type:Number,
     required:true
   },
   owner: {
     type: mongoose.Schema.Types.ObjectId,
     ref: 'User',
     required: true
   }
 }, {
  timestamps: true
})

module.exports = mongoose.model('Transaction', transactionSchema)
