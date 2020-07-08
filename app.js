//jshint esversion:6

///////////////////////////////////////////////////////////////////
//REQUIRED Modules and Assignements////////////////////////////////
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true});

///////////////////////////////////////////////////////////////////
//DB Collection Creation//////////////////////////////////////////
const itemSchema = new mongoose.Schema ({
  name: String
});
const Item = mongoose.model("Item", itemSchema);
const item1 = new Item ({
  name: "Item Placeholder"
});
const defaultItems = [item1];

const listSchema = {
  name: String,
  items: [itemSchema]
};
const List = mongoose.model("List", listSchema);

///////////////////////////////////////////////////////////////////
//GET and POST Requests///////////////////////////////////////////
app.get("/", function(req, res) {
  List.find({}, function(err, tableOfContents) {
    if (err) {
      console.log(err);
    } else {
      Item.find({}, function(err, todoItems) {
        if (todoItems.length === 0) {
          Item.insertMany(defaultItems, function(err) {
            if (err) {
              console.log(err);
            } else {
              console.log("Todo items added to list successfully.");
            }
          });
          res.redirect("/");
        } else {
          res.render("list", {listTitle: "Today", newListItems: todoItems, tableOfContents: tableOfContents});
        }
      });
    }
  });
});

app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const addItem = new Item ({
    name: itemName
  });
  if (listName === "Today") {
    addItem.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList) {
      foundList.items.push(addItem);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/change", function(req, res) {
  const listID = req.body.tocButton;
  let listName = "";
  List.findOne({_id: listID}, function(err, foundList) {
    listName = foundList.name;
    if (listName === "Favicon.ico") {
      res.redirect("/");
    } else {
      res.redirect("/" + listName);
    }
  });
});

app.post("/delete", function(req, res) {
  const checkedItemID = req.body.doneCheckBox;
  const listName = req.body.listName;
  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemID, function(err) {
      if (!err) {
        console.log("Item deleted successfully.");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemID}}}, function(err, foundList) {
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }
});

app.post("/delete-list", function(req, res) {
  const checkedListID = req.body.tocCheckbox;
  List.findByIdAndRemove(checkedListID, function(err) {
    if (!err) {
      console.log("List deleted successfully.");
      res.redirect("/");
    }
  });
});

app.post("/custom", function(req, res) {
  const customTitle = req.body.customListInput;
  res.redirect("/" + customTitle);
});

app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);
  List.find({}, function(err, tableOfContents) {
    if (err) {
      console.log(err);
    } else {
      List.findOne({name: customListName}, function(err, foundList) {
        if (!err) {
          if (!foundList) {
            //Create new list
            const list = new List ({
              name: customListName,
              items: defaultItems
            });
            list.save();
            res.redirect("/" + customListName);
          } else {
            //Show existing list.
            res.render("list", {listTitle: foundList.name, newListItems: foundList.items, tableOfContents: tableOfContents});
          }
        }
      });
    }
  });
});

app.get("/about", function(req, res){
  res.render("about");
});

///////////////////////////////////////////////////////////////////
//Listener/////////////////////////////////////////////////////////
app.listen(3000, function() {
  console.log("Server started on port 3000");
});
