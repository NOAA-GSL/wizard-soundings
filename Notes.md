## NPM Notes for Creating and Managing Packages

- Here are the steps needed to create an NPM package and push from the console. This is the manual process, but it can be automated from GitHub or wherever the repo is managed. This assumes using Vite in [Library Mode](https://vite.dev/guide/build#library-mode)

1. Build the `/dist` folder with Vite using `npm run build`
2. Login to account with `npm login`
    - Can also use `npm adduser` and login with browser
3. Can double-check with `npm whoami`
4. Make sure the version number is changing from the previously published version
    - Instead of doing a manual version update to the patch number:

    ```bash
    # this will bump the patch version by 1 in the package.json and package-lock.json
    # run from /library
    npm version patch
    ```

5. Run
    ```bash
    # run from /library
    npm publish
    ```
