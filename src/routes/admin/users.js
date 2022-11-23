const authResponse = require('../../middleware/auth-response');

const { User } = require('../../database/models/user');

const { WishList } = require('../../database/models/wish-list');

const mailer = require('../../shared/mailer');

async function deleteUser(req, res, next) {
  const userId = req.params.userId;

  try {
    const users = await User.find({
      _id: userId,
    })
      .limit(1)
      .select('_id');

    const user = users[0];

    if (!user) {
      next(new Error('User not found.'));
      return;
    }

    await user.remove();

    authResponse({
      data: {},
      message: 'User successfully deleted.',
    })(req, res, next);
  } catch (err) {
    next(err);
  }
}

async function getUsers(req, res, next) {
  try {
    const users = await User.find({})
      .select(
        'firstName lastName dateCreated dateLastLoggedIn emailAddress emailAddressVerified'
      )
      .sort('-dateLastLoggedIn')
      .lean();

    const wishLists = await WishList.find({}).select('_user name').lean();

    const mailingListMembers = await mailer.getMailingListMembers();

    const formatted = users.map((user) => {
      let isEmailSubscribedToMailingList = false;
      let emailExistsOnMailingList = false;

      const mailingListMember = mailingListMembers.find((member) => {
        return member.address === user.emailAddress;
      });

      if (mailingListMember) {
        isEmailSubscribedToMailingList = mailingListMember.subscribed;
        emailExistsOnMailingList = true;
      }

      return {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        emailAddress: user.emailAddress,
        emailAddressVerified: user.emailAddressVerified,
        emailExistsOnMailingList,
        dateCreated: user.dateCreated,
        dateLastLoggedIn: user.dateLastLoggedIn,
        isEmailSubscribedToMailingList,
        wishLists: wishLists
          .filter((wishList) => {
            return wishList._user.toString() === user._id.toString();
          })
          .map((wishList) => {
            return {
              id: wishList._id,
              name: wishList.name,
            };
          }),
      };
    });

    authResponse({
      data: {
        users: formatted,
      },
    })(req, res, next);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  deleteUser,
  getUsers,
};
