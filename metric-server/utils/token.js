const retrieveAccessToken = (res,headers) => {
    const authHeader = headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401);
        throw new Error('No token provided');
    }

    const token = authHeader.split(' ')[1];
    return token;
}

export default retrieveAccessToken;