const idamWrapper = require('../wrapper');
const UUID = require('uuid/v4');
const { Logger } = require('@hmcts/nodejs-logging');
const config = require('../config');
const cookies = require('../utilities/cookies');

const logger = Logger.getLogger(__filename);

const idamExpressAuthenticate = (args = {}) => {
  const idamFunctions = idamWrapper.setup(args);

  const tokenCookieName = args.tokenCookieName || config.tokenCookieName;
  const stateCookieName = args.stateCookieName || config.stateCookieName;

  return (req, res, next) => {
    const stateCookie = cookies.get(req, stateCookieName);
    if (stateCookie) {
      cookies.remove(res, stateCookieName);
    }

    const redirectUser = () => {
      const state = UUID();
      cookies.set(res, stateCookieName, state, args.hostName);
      res.redirect(idamFunctions.getIdamLoginUrl({ state }));
    };

    const authToken = cookies.get(req, tokenCookieName);
    if (authToken) {
      idamFunctions
        .getUserDetails(authToken)
        .then((/* userDetails */) => {
          next();
        })
        .catch(error => {
          logger.error(`User is not authenticated: ${error}`);
          redirectUser();
        });
    } else {
      redirectUser();
    }
  };
};

module.exports = idamExpressAuthenticate;
