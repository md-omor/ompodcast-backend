const jwt = require("jsonwebtoken");
const refreshModal = require("../models/refresh-model");
const accessTokenSecret = process.env.JWT_ACCESS_TOKEN_SECRET;
const refreshTokenSecret = process.env.JWT_REFRESH_TOKEN_SECRET;

class TokenService {
  generateTokens(payload) {
    const accessToken = jwt.sign(payload, accessTokenSecret, {
      expiresIn: "1m",
    });
    const refreshToken = jwt.sign(payload, refreshTokenSecret, {
      expiresIn: "1y",
    });
    return { accessToken, refreshToken };
  }

  // async storeRefreshToken(token, userId) {
  //   try {
  //     await refreshModal.create({
  //       token,
  //       userId,
  //     });
  //   } catch (error) {
  //     console.log(error.message);
  //   }
  // }

  // async verifyAccessToken(token) {
  //   return jwt.verify(token, accessTokenSecret);
  // }

  // async verifyRefreshToken(refreshToken) {
  //   return jwt.verify(refreshToken, refreshTokenSecret);
  // }

  // async findRefreshToken(userId, refreshToken) {
  //   return await refreshModal.findOne({
  //     userId: userId,
  //     token: refreshToken,
  //   });
  // }

  // async updateRefreshToken(userId, refreshToken) {
  //   return await refreshModal.updateOne(
  //     { userId: userId },
  //     { token: refreshToken }
  //   );
  // }

  async storeRefreshToken(token, userId) {
    try {
      await refreshModal.create({
        token,
        userId,
      });
    } catch (err) {
      console.log(err.message);
    }
  }

  async verifyAccessToken(token) {
    return jwt.verify(token, accessTokenSecret);
  }

  async verifyRefreshToken(refreshToken) {
    return jwt.verify(refreshToken, refreshTokenSecret);
  }

  async findRefreshToken(userId, refreshToken) {
    return await refreshModal.findOne({
      userId: userId,
      token: refreshToken,
    });
  }

  async updateRefreshToken(userId, refreshToken) {
    return await refreshModal.updateOne(
      { userId: userId },
      { token: refreshToken }
    );
  }

  async removeToken(refreshToken) {
    return await refreshModal.deleteOne({ token: refreshToken });
  }
}

module.exports = new TokenService();
