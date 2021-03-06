/**
 * ExchangeController
 *
 * @description :: Server-side logic for managing exchanges
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

	sell: (req,res) => {
    let data = {
      text: 'Bán'
    };
    let params = req.allParams();

    Item.find({sell:1}).exec(function(err,foundItemsell) {
      data.foundItemsell = foundItemsell;
      Item.find({buy:1}).exec(function(err,foundItembuy) {
        data.foundItembuy = foundItembuy;
        Item.findOne({link:params.i}).exec(function(err,findType){
          data.price_sell = findType.price_sell;
          data.name = findType.name;
          data.icon = findType.icon;
          data.link = findType.link;
          return res.view("homepage",data)
        })
      })
    })
  },

  buy: (req,res) => {
    let data = {
      text: 'Mua'
    };
    let params = req.allParams();

    Item.find({buy:1}).exec(function(err,foundItembuy) {
      data.foundItembuy = foundItembuy;
      Item.find({sell:1}).exec(function(err,foundItemsell) {
        data.foundItemsell = foundItemsell;
        Item.findOne({link:params.i}).exec(function(err,findType){
          data.price_buy = findType.price_buy;
          data.name = findType.name;
          data.icon = findType.icon;
          data.link = findType.link;
          return res.view("homepage",data)
        })
      })
    })
  },

  ban: (req,res) => {
    let data = {
      currentDate: (new Date()).toString()
    };
    if (!req.isSocket) {
      return res.badRequest()
    }
    let params = req.allParams();
    Exchange.findOne({code:params.excode}).exec(function(err,existscode){
      if (existscode) {
        var newcode = 'a'+existscode.code;
      } else {
        var newcode = params.excode;
      }
      Exchange.create({
        ex: 'Bán',
        quantity: params.quantity_sell,
        item: params.item_sell,
        price: params.money_recieve,
        code: newcode,
        name: params.name_vcb,
        number: params.number_vcb,
        status: 'Pending'
      }).exec(function(err,done) {
        if (err) {
          return res.negotiate(err);
        }
        sails.log('giao dịch mới tạo : ',done);
        sails.sockets.join(req, params.excode);
        sails.sockets.broadcast(params.excode,'ex/pending',{send_code:newcode});
        sails.sockets.blast('add/exchange',done);
      })
    });
  },

  mua: (req,res) => {
    let data = {
      currentDate: (new Date()).toString()
    };
    if (!req.isSocket) {
      return res.badRequest()
    }
    let params = req.allParams();
    Exchange.findOne({code:params.excode}).exec(function(err,existscode){
      if (existscode) {
        var newcode = 'a'+existscode.code;
      } else {
        var newcode = params.excode;
      }
      Exchange.create({
        ex: 'Mua',
        quantity: params.quantity_buy,
        item: params.item_buy,
        price: params.price_buy,
        code: newcode,
        address: params.address,
        status: 'Pending'
      }).exec(function(err,done) {
        if (err) {
          return res.negotiate(err);
        }
        sails.log('giao dịch mới tạo : ',done);
        sails.sockets.join(req, params.excode);
        sails.sockets.broadcast(params.excode,'ex/pending',{send_code:newcode});
        sails.sockets.blast('add/exchange',done);
      })
    });
  },

  view: (req,res) => {
    let params = req.allParams();
    Exchange.findOne({code:params.i}).exec(function(err,foundBill){
      return res.view('templates/check',{foundBill})
    });
  },

  manager: (req,res) => {
    sails.log.info('who is login ?',req.session.user.group);
    Exchange.find(function(err,allExchange) {
      if (err) {
        return res.negotiate(err)
      }
      res.view('admin/ex_manager',{allExchange});
    });
  },

  process: (req,res) => {
    let magiaodich = req.params.code;
    Exchange.find({where:{status:'Pending'}}).exec(function(err,allExchange) {
      if (err) { return res.negotiate }
      Exchange.findOne({code:magiaodich}).exec(function(err,result) {
        return res.view('admin/process',{result,allExchange});
      })
    })
  },

  delete: (req,res) => {
    let magiaodich = req.params.code;
    Exchange.destroy({code:magiaodich}).exec(function(err,result) {
      return res.redirect('/admin/exchange')
    })
  },

  update: (req,res) => {
    if (!req.isSocket) {
      return res.badRequest('Chỉ có Admin mới có quyền cập nhật dữ liệu')
    }
    let params = req.allParams();
    Exchange.update({id:params.id},{status:params.status}).exec(function(err){
      if (err) { return res.negotiate }
      sails.sockets.broadcast(params.excode,'update/exchange',{msg:params.status});
      sails.sockets.blast('admin/updatestt')
    })
  }

};

