import { makeAutoObservable, runInAction } from "mobx";
import { store } from "./store";
import { User } from "../common/interfaces/UserInterface";
import { AuthUserDto, LoginRequestDto } from "../common/interfaces/AuthInterface";
import agent from "../api/agent";
import { router } from "../router/Router";

export default class UserStore {
    user: User | null = null;
    loading = false;
    refreshTokenTimeout: NodeJS.Timeout | null = null;

    constructor() {
        makeAutoObservable(this);
    }

    get isLoggedIn() {
        return !!this.user;
    }

   

    login = async (email: string, password: string) => {
        const loginRequest: LoginRequestDto = {
            email,
            password
        };
        const response = await agent.AccountRequests.login(loginRequest);
        const user: User = {
            id: response.id,
            name: response.name,
            email: response.email,
        }
        store.commonStore.setToken(response.token);
        runInAction(() => {
            this.startRefreshTokenTimer({...user, token: response.token });
            this.user = user;
            this.getUser();
            router.navigate("/");
        });
    };

    // register = async (user: RegisterRequestDto) => {
    //     try {
    //         const response = await agent.AccountRequests.register(user);
    //         store.commonStore.setToken(response.token);
    //         const newUser: User = {
    //             name: response.name,
    //             surname: response.surname,
    //             email: response.email,
    //             role: response.role
    //         }
    //         runInAction(() => {
    //             this.user = newUser;
    //         });
    //     } catch (error) {
    //         console.log(error);
    //     }
    // };

    logout = () => {
        store.commonStore.setToken(null);
        this.user = null;
        this.stopRefreshTokenTimer();
        router.navigate("/");
    }

    getUser = async () => {
        try {
            const response = await agent.AccountRequests.current();
            store.commonStore.setToken(response.token);
            const user: User = {
                id: response.id,
                name: response.name,
                email: response.email,
            }
            runInAction(() => {
                this.startRefreshTokenTimer({...response, token: response.token });
                this.user = user;
            });
        } catch (error) {
            console.log(error);
        }
    }

    refreshToken = async () => {
        this.stopRefreshTokenTimer();
        try {
            const user = await agent.AccountRequests.refreshToken();
            runInAction(() => {
                this.user = user;
            });
            store.commonStore.setToken(user.token);
            this.startRefreshTokenTimer(user);
        } catch (error) {
            console.log(error);
        }
    }

    private startRefreshTokenTimer = (user: AuthUserDto) => {
        const jwtToken = JSON.parse(atob(user.token.split(".")[1]));
        const expires = new Date(jwtToken.exp * 1000);
        const timeout = expires.getTime() - Date.now() - (30 * 1000);
        this.refreshTokenTimeout = setTimeout(this.refreshToken, timeout);
    }

    private stopRefreshTokenTimer = () => {
        if (this.refreshTokenTimeout)
            clearTimeout(this.refreshTokenTimeout);
    };
}