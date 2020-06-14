import {Component, OnInit} from "@angular/core";
import {UserService} from "../shared/user.service";
// import * as firebase from 'firebase';
import {Router} from "@angular/router";
import {ModalService} from "../shared/modal.service";
import {Friend, Message} from "../shared/model";
import {NgForm} from "@angular/forms";
import {DatePipe} from "@angular/common";
import {NotificationService} from "../shared/notification.service";
import {AngularFireDatabase} from "@angular/fire/database";
import {AngularFireAuth} from "@angular/fire/auth";
import {ChatService} from "../shared/chat.service";

@Component({
  selector: "app-profile",
  templateUrl: "./profile.component.html",
  styleUrls: ["./profile.component.css"]
})
export class ProfileComponent implements OnInit {
  public userDataId;
  public profilePicturePath = "";
  public fullName;
  public followers;
  public following;
  public postsNumber;
  public posts: Array<string>;
  modalTitle = "";
  public followersList: Array<Friend>;
  public followingList: Array<Friend>;
  public route = "";
  public isFollowing: boolean;
  public followUnfollowBtn: string;

  constructor(
    private datePipe: DatePipe,
    private userService: UserService,
    private chatService: ChatService,
    private modalService: ModalService,
    private notificationService: NotificationService,
    private router: Router,
    private firebaseDatabase: AngularFireDatabase,
    private firebaseAuth: AngularFireAuth
  ) {
    this.route = router.url;
  }

  ngOnInit() {
    this.postsNumber = 0;
    this.posts = [];
    this.followersList = [];
    this.followingList = [];
    this.followers = 0;
    this.following = 0;
    this.isFollowing = this.isFollowingTo();
    this.followUnfollowBtn = "Seguir";

    this.firebaseAuth.currentUser
      .then((userData) => {
        //console.log("mn jndsvjk sd.vznkjvfdnkldz vk.d.vlkd", userData.uid);
        this.userDataId = userData.uid;

        this.getProfilePhoto(this.userDataId)
          .then((photo) => {
            this.profilePicturePath = photo.val();
          })
          .catch((error) => {
            console.error("error", error);
          });

        this.getFullName(this.userDataId)
          .then((name) => {
            this.fullName = name.val();
          })
          .catch((error) => {
            console.error("error", error);
          });
      })
      .catch((error) => {
        console.error("error", error);
      });
    /** Cambiar forma de conseguir las cosas */
    /*this.getProfilePhoto()
      .then((photo) => {
        console.log('jqdbluwhdbiuwhfiuehlaefbuefbiulaebfiueraufaleub',photo);
        this.profilePicturePath = photo.val();
        console.log('------------------', this.profilePicturePath);
      })
      .catch((error) => {
        console.error('error', error);
      });*/

    /*this.getFullName()
      .then((name) => {
        this.fullName = name.val();
      })
      .catch((error) => {
        console.error('error', error);
      });*/

    this.getNumberFollowersAndFollowing();

    this.getPosts();
  }

  getUser() {
    this.firebaseAuth.currentUser
      .then((userData) => {
        console.log("mn jndsvjk sd.vznkjvfdnkldz vk.d.vlkd", userData.uid);
        this.userDataId = userData.uid;
      })
      .catch((error) => {
        console.error("error", error);
      });
  }

  getNumberFollowersAndFollowing() {
    if (this.route === "/myprofile") {
      this.userService.getUserFollowing().then((following) => {
        if (following.val() != null) {
          this.following = following.val().length;
        }
      });

      this.userService.getUserFollowers().then((followers) => {
        if (followers.val() != null) {
          this.followers = followers.val().length;
        }
      });
    } else {
      const userId = this.route.replace("/user", "");
      this.userService.getUserFollowing(userId).then((following) => {
        if (following.val() != null) {
          this.following = following.val().length;
        }
      });

      this.userService.getUserFollowers(userId).then((followers) => {
        if (followers.val() != null) {
          this.followers = followers.val().length;
        }
      });
    }
  }

  getPosts() {
    if (this.route === "/myprofile") {
      this.userService.getUserPosts().then((userPosts) => {
        try {
          userPosts.forEach((element) => {
            let p = element.val();
            this.posts.push(p["img"]);
            this.postsNumber++;
          });
        } catch (e) {
          console.error(e);
        }
      });
    } else if (this.route.includes("user")) {
      const userId = this.route.replace("/user", "");
      this.userService.getUserPosts(userId).then((userPosts) => {
        try {
          userPosts.forEach((element) => {
            let p = element.val();
            this.posts.push(p["img"]);
            this.postsNumber++;
          });
        } catch (e) {
          console.error(e);
        }
      });
    }
  }

  getProfilePhoto(userId: string) {
    if (this.route === "/myprofile") {
      return this.firebaseDatabase.database.ref("/users/" + userId + "/profilePhoto").once(
        "value",
        (snapshot) => {
          return snapshot.val();
        },
        (errorObject) => {
          console.error("The read failed: " + errorObject);
        }
      );
    } else if (this.route.includes("user")) {
      const userId = this.route.replace("/user", "");
      return this.firebaseDatabase.database.ref("/users/" + userId + "/profilePhoto").once(
        "value",
        (snapshot) => {
          return snapshot.val();
        },
        (errorObject) => {
          console.error("The read failed: " + errorObject);
        }
      );
    }
  }

  getFullName(userId: string) {
    let id = "";
    if (this.route === "/myprofile") {
      id = userId;
    } else if (this.route.includes("user")) {
      id = this.route.replace("/user", "");
    }

    return this.firebaseDatabase.database.ref("/users/" + id + "/fullName").once(
      "value",
      (snapshot) => {
        return snapshot.val();
      },
      (errorObject) => {
        console.error("The read failed: " + errorObject);
      }
    );
  }

  editProfile() {
    this.router.navigate(["/editmyprofile"]);
  }

  openFollowers(mymodal) {
    this.modalTitle = "Seguidores";
    let list = [];
    let id = "";
    if (this.route === "/myprofile") {
      id = this.userDataId;
    } else if (this.route.includes("user")) {
      id = this.route.replace("/user", "");
    }
    this.userService.getUserFollowers(id).then((seguidores) => {
      if (seguidores.val() != null) {
        seguidores.val().forEach((element) => {
          this.firebaseDatabase.database.ref("/users/" + element).once(
            "value",
            (snapshot) => {
              const friend: Friend = {
                id: element,
                name: snapshot.val()["fullName"],
                photoUrl: snapshot.val()["profilePhoto"]
              };
              list.push(friend);
            },
            (errorObject) => {
              console.error("The read failed: " + errorObject);
            }
          );
        });
      }
    });

    this.followersList = list;
    this.modalService.open(mymodal);
  }

  openFollowing(mymodal) {
    this.modalTitle = "Siguiendo";
    let list = [];
    let id = "";
    if (this.route === "/myprofile") {
      id = this.userDataId;
    } else if (this.route.includes("user")) {
      id = this.route.replace("/user", "");
    }

    this.userService.getUserFollowing(id).then((siguiendo) => {
      if (siguiendo.val() != null) {
        siguiendo.val().forEach((element) => {
          this.firebaseDatabase.database.ref("/users/" + element).once(
            "value",
            (snapshot) => {
              const friend: Friend = {
                id: element,
                name: snapshot.val()["fullName"],
                photoUrl: snapshot.val()["profilePhoto"]
              };
              list.push(friend);
            },
            (errorObject) => {
              console.error("The read failed: " + errorObject);
            }
          );
        });
      }
    });

    this.followingList = list;
    this.modalService.open(mymodal);
  }

  goToFriendsProfile(friendURl: string) {
    if (friendURl === this.userDataId) {
      friendURl = "/myprofile";
    } else {
      friendURl = "user/" + friendURl;
    }
    this.router.navigate([friendURl]);
    this.modalService.close();
  }

  isFollowingTo(): boolean {
    let f = false;
    if (this.route.includes("user/")) {
      let url = this.route.replace("/user/", "");
      this.userService.getUserFollowing().then((following) => {
        if (following.val() != null) {
          let i = 0;
          while (i < following.val().length && !f) {
            if (following.val()[i] === url) {
              f = true;
              this.followUnfollowBtn = "Dejar de seguir";
            }
            i++;
          }
        }
      });
    }
    return f;
  }

  startToFollowUnfollow() {
    let id = this.router.url.replace("/user/", "");
    if (this.followUnfollowBtn === "Seguir") {
      this.follow(id);
    } else if (this.followUnfollowBtn === "Dejar de seguir") {
      this.unfollowFromModal(id);
    }
  }

  follow(id: string) {
    const currentUser = this.userDataId;
    let followersArray: Array<string> = [];
    this.firebaseDatabase.database
      .ref("/followers/" + id)
      .once(
        "value",
        (snapshot) => {
          followersArray = snapshot.val();
          if (followersArray != null) {
            followersArray.push(currentUser);
          } else {
            followersArray = [currentUser];
          }
          this.firebaseDatabase.database.ref("/followers/" + id).set(followersArray);
        },
        (errorObject) => {
          console.error("The read failed: " + errorObject);
        }
      )
      .then(() => {
        this.ngOnInit();
      });

    let followingArray: Array<string> = [];
    this.firebaseDatabase.database
      .ref("/following/" + currentUser)
      .once(
        "value",
        (snapshot) => {
          followingArray = snapshot.val();
          if (followingArray != null) {
            followingArray.push(id);
          } else {
            followingArray = [id];
          }
          this.firebaseDatabase.database.ref("/following/" + currentUser).set(followingArray);
        },
        (errorObject) => {
          console.error("The read failed: " + errorObject);
        }
      )
      .then(() => {
        this.ngOnInit();
      });
    this.notificationService.showSuccessMessage("Éxito", "Ha empezado a seguir a");
    this.followUnfollowBtn = "Dejar de seguir";
  }

  unfollowFromModal(id: string) {
    const currentUser = this.userDataId;
    let followersArray: Array<string> = [];
    this.firebaseDatabase.database.ref("/followers/" + id).once(
      "value",
      (snapshot) => {
        followersArray = snapshot.val();
        if (followersArray != null) {
          followersArray.splice(followingArray.indexOf(currentUser));
        }
        this.firebaseDatabase.database.ref("/followers/" + id).set(followersArray);
      },
      (errorObject) => {
        console.error("The read failed: " + errorObject);
      }
    );

    let followingArray: Array<string> = [];
    this.firebaseDatabase.database
      .ref("/following/" + currentUser)
      .once(
        "value",
        (snapshot) => {
          followingArray = snapshot.val();
          if (followingArray != null) {
            followingArray.splice(followingArray.indexOf(id));
          }
          this.firebaseDatabase.database.ref("/following/" + currentUser).set(followingArray);
        },
        (errorObject) => {
          console.error("The read failed: " + errorObject);
        }
      )
      .then(() => {
        this.ngOnInit();
      });
    this.notificationService.showSuccessMessage("Éxito", "Ha dejado de seguir");
    this.followUnfollowBtn = "Seguir";
    this.modalService.close();
  }

  openModalMessage(modal) {
    this.modalService.open(modal);
  }

  sendMessage(form: NgForm) {
    const mensaje = form.value.msg;
    if (mensaje !== "") {
      form.resetForm();
      let now = new Date();
      let n = this.datePipe.transform(now, "dd-MM-yyyy HH:mm");
      const current = new Date();

      const stamp = current.getTime();
      let nMessage: Message = {
        datetime: n,
        message: mensaje,
        sender: this.userDataId,
        timestamp: stamp
      };
      let messagesList: Array<Message> = [];
      let conversations: Array<string> = [];
      let roomsArray: Array<string> = [];
      let id = this.userDataId;
      let friendId = this.router.url.replace("/user/", "");

      let roomName = this.userDataId + "_" + friendId;
      let otherRoomName = friendId + "_" + this.userDataId;

      //Verifica el nombre de la sala de chat si existe, si no crea una
      this.firebaseDatabase.database
        .ref("/conversationsPerUser/" + id)
        .once("value", function (snapshot) {
          if (snapshot.val() != null) {
            roomsArray = snapshot.val();
            roomsArray.forEach((element) => {
              if (element.toString() == otherRoomName) {
                roomName = otherRoomName;
              }
            });
          }

          this.firebaseDatabase.database.ref("/chatRooms/" + roomName + "/timestamp").set(stamp);

          let users = {user1: id, user2: friendId};
          this.firebaseDatabase.database.ref("/chatRooms/" + roomName + "/users").set(users);
          messagesList.push(nMessage);
          this.firebaseDatabase.database
            .ref("/chatRooms/" + roomName + "/messages")
            .set(messagesList);
          this.firebaseDatabase.database
            .ref("/conversationsPerUser/" + id)
            .once("value", function (snapshot) {
              if (snapshot.val() != null) {
                conversations = snapshot.val();
              }
              if (!conversations.includes(roomName)) {
                conversations.push(roomName);
                console.log("conv", conversations);
                this.firebaseDatabase.database
                  .ref("/conversationsPerUser/" + id)
                  .set(conversations);
              }

              conversations = [];
              this.firebaseDatabase.database
                .ref("/conversationsPerUser/" + friendId)
                .once("value", function (snapshot) {
                  if (snapshot.val() != null) {
                    conversations = snapshot.val();
                  }
                  if (!conversations.includes(roomName)) {
                    conversations.push(roomName);
                    console.log("conv amigo", conversations);
                    this.firebaseDatabase.database
                      .ref("/conversationsPerUser/" + friendId)
                      .set(conversations);
                  }
                });
            });
        });
    }
  }
}
