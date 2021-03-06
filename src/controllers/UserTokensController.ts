/*
 * Copyright (c) 2020. This code created and belongs to Atlas render manager project.
 * Owner and project architect: Danil Andreev | danssg08@gmail.com |  https://github.com/DanilAndreev
 * Project: atlas-core
 * File last modified: 11/12/20, 5:25 PM
 * All rights reserved.
 */

import Controller from "../core/Controller";
import {Context} from "koa";
import * as CryptoRandomString from "crypto-random-string";
import UserToken from "../entities/typeorm/UserToken";
import User from "../entities/typeorm/User";
import RequestError from "../errors/RequestError";
import {getRepository} from "typeorm";
import {UserTokenCreateBodyValidator} from "../validators/UserTokensValidators";
import Authenticator from "../core/Authenticator";
import HTTPController from "../decorators/HTTPController";
import Route from "../decorators/Route";
import RouteValidation from "../decorators/RouteValidation";


/**
 * UserTokensController - controller for /tokens routes.
 * @class
 * @author Danil Andreev
 */
@HTTPController("/tokens")
export default class UserTokensController extends Controller {
    /**
     * Route __[POST]__ ___/tokens___ - creates new token.
     * @method
     * @param ctx - HTTP Context
     * @author Danil Andreev
     */
    @Route("POST", "/")
    @RouteValidation(UserTokenCreateBodyValidator)
    public async createUserToken(ctx: Context): Promise<void> {
        const user: Authenticator.UserJwt = ctx.state.user;
        const input = ctx.request.body;

        const {description, name} = input;

        // TODO: add token length from config.
        const token: string = CryptoRandomString({length: 30, type: "base64"});

        const owner = await User.findOne({where: {id: user.id}});

        const userToken = new UserToken();
        userToken.name = name;
        userToken.description = description;
        userToken.token = token;
        userToken.user = owner;
        const result = await userToken.save({});
        delete result.user;
        ctx.body = result;
    }

    /**
     * Route __[DELETE]__ ___/tokens/:id___ - delete selected token.
     * @method
     * @param ctx - HTTP Context
     * @author Danil Andreev
     */
    @Route("DELETE", "/:id")
    public async deleteToken(ctx: Context): Promise<void> {
        const user: Authenticator.UserJwt = ctx.state.user;
        const id: number = +ctx.params.id;

        const token = await UserToken.findOne({where: {id}, relations: ["user"]});

        if (user.id !== token.user.id) {
            throw new RequestError(403, "You have no permissions to delete this token");
        }

        ctx.body = await UserToken.delete(token.id);
    }

    /**
     * Route __[GET]__ ___/tokens___ - get array of all tokens.
     * @method
     * @param ctx - HTTP Context
     * @author Danil Andreev
     */
    @Route("GET", "/")
    public async getAllTokens(ctx: Context): Promise<void> {
        const user: Authenticator.UserJwt = ctx.state.user;
        const tokens = await getRepository<UserToken>(UserToken)
            .createQueryBuilder("user_token")
            .select([
                "user_token.id",
                "user_token.name",
                "user_token.description",
                "user_token.createdAt"
            ])
            .where("user_token.user = :id", {id: user.id})
            .getMany();
        ctx.body = tokens;
    }
}
