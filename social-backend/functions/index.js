const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.createUserDocument = functions.auth.user().onCreate(async (user) => {
  const userData = {
    uid: user.uid,
    email: user.email || null,
    displayName: user.displayName || "",
    photoURL: user.photoURL || "",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await admin.firestore()
      .collection("users")
      .doc(user.uid)
      .set(userData);
});
