//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-rohan:test123@cluster0.rcqjb.mongodb.net/itemsDB", {useNewUrlParser: true});

const ItemSchema = new mongoose.Schema({
  name: String
});

const Items = mongoose.model("item", ItemSchema);


//Instead of passing an array we passed docs with mongodb to store it in DB
const item1 = new Items({
  name: "Welcome to my ToDo App"
});

const item2 = new Items({
  name: "Hit + to add an item."
});

const item3 = new Items({
  name: "Hit the checkbox to delete an item."
});

const defaultItems = [item1,item2,item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [ItemSchema]
});

const List = mongoose.model("list", listSchema);


app.get("/", function(req, res) {

  Items.find({}, function(err, foundItems){                            
    if(foundItems.length===0){                                      //This code is used so that the default doc is rendered only once when the db is empty
      Items.insertMany(defaultItems, function(err){
        if(err){
          console.log(err);
        }else{
          console.log("Successfully added items to DB.");
        }
      });
      res.redirect("/");                                            //Both the line of code is used so that the default items is shown in our website
    }else{
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
    
  });

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;                                //This is used to store the input by user to DB and render a HTML page.
  const listName = req.body.list;

  const item = new Items({
    name: itemName
  });

  if(listName==="Today"){
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name: listName}, function(err,foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
  
});

app.post("/delete", function(req,res){                             //This is used to delete an item and render to home page.
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Items.findByIdAndRemove(checkedItemId, function(err){
      if(!err){
        console.log("Successfully deleted the item.");
        res.redirect("/");
      }  
    });
  }else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if(!err){
        res.redirect("/" + listName);
      }
    });
  }
  
});

app.get("/:name", function(req,res){
  const name = _.capitalize(req.params.name);

  List.findOne({name:name}, function(err, foundList){
    if(!err){
      if(!foundList){
        //Create a list here
        const list = new List({
          name: name,
          items: defaultItems
        });
      
        list.save();
        res.redirect("/" + name);
      }else{
        //Show an existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });
  
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
