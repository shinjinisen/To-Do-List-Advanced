//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose =require('mongoose');
// const date = require(__dirname + "/date.js");
const _ = require("lodash");
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

main().catch(err=> console.log(err));
async function main(){
  await mongoose.connect('mongodb://127.0.0.1:27017/todolistDB');
}

const itemsSchema={
  name:String
};
const Item= mongoose.model("Item",itemsSchema);
const act1=new Item({
  name:"Welcome to your todolist"
});
const act2=new Item({
  name:"Hit the + button to add a new item"
});
const act3=new Item({
  name:"<---- Hit this to delete an item "
});

const defaultItems=[act1,act2,act3];

const listSchema={
  name:String,
  items:[itemsSchema]
};
const List=mongoose.model("List", listSchema);


app.get("/", function(req, res) {
  Item.find({})
    .then(foundItems => {
      if (foundItems.length === 0) {
        return Item.insertMany(defaultItems);
      } else {
        return Promise.resolve(foundItems);
      }
    })
    .then(items => {
      res.render("list", { listTitle: "Today", newListItems: items });
    })
    .catch(err => {
      console.error("ERROR", err);
    });
});

app.get("/:customListName",function(req,res){
  const customListName= _.capitalize(req.params.customListName);
  List.findOne({ name: customListName })
  .then((foundList) => {
    if (!foundList) {
      const list = new List({
        name: customListName,
        items: defaultItems,
      });
      return list.save();
    } else {
      return Promise.resolve(foundList);
    }
  })
  .then((list) => {
    if (list) {
      res.render("list", { listTitle: list.name, newListItems: list.items });
    }
  })
  .catch((err) => {
    console.error("Error:", err);
  });
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName= req.body.list;

  const item=new Item({
    name :itemName
  });
  if (listName === "Today") {
    item.save()
      .then(() => {
        res.redirect("/");
      })
      .catch((err) => {
        console.error("Error saving item:", err);
      });
  } else {
    List.findOne({ name: listName })
      .then((foundList) => {
        if (foundList) {
          foundList.items.push(item);
          return foundList.save();
        }
        return Promise.reject("List not found");
      })
      .then(() => {
        res.redirect("/" + listName);
      })
      .catch((err) => {
        console.error("Error:", err);
      });
  }
  
  // PROBLEM 1: 
  // if(listName==="Today"){
  //   item.save();
  //   res.redirect("/");
  // }else{
  //   List.findOne({name:listName}, function(err, foundList){
  //      foundList.items.push(item)
  //      foundList.save();
  //      res.redirect("/"+ listName);
  //   });
  // }
});

app.post("/delete", function(req,res){
  const checkedItemId= req.body.checkbox;
  const listName=req.body.listName;
  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId)
      .then(() => {
        console.log('Item deleted');
        res.redirect('/');
      })
      .catch((err) => {
        console.error('Error deleting item:', err);
      });
  } else {
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } })
      .then(() => {
        res.redirect("/" + listName);
      })
      .catch((err) => {
        console.error('Error updating list:', err);
      });
  }
  
  // PROBLEM 2:
  // if(listName==="Today"){
  //  Item.findByIdAndRemove(checkedItemId, function(err){
  // 	if(!err){
  //     console.log("Item deleted");
  //     res.redirect('/');
  //    }
  // });
  // }else{
  //  List.findOneAnd Update({name: listName},{$pull: {items: {_id:checkedItemId}}},function(err,foundList){
  //   if(!err){
  //     res.redirect("/"+listName);
  //   }
  // });
  // }
  });
  

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
