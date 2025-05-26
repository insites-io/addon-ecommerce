var apiServices = (function () {
    const
        defaultApiUrl = "/api";
        request = axios.create({});

    let config = {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('[name="csrf-token"]').content,
            'Authorization': 'instance_9f020173-8d37-4d70-8cba-f4fc555d5d46_1KkPiTLIaxmoiQPj1ZxeohYDBu367M62vVwvGMaZlSY'
        }
    };

    // Axios Processor
    async function processRequest(method, url, payload, headers = config.headers, customApiUrl = null) {
        let endpoint = (customApiUrl || defaultApiUrl) + url;
        let process = method.toLowerCase() === 'get'
            ? request.get(endpoint, { headers })
            : request[method](endpoint, payload, { headers });

        return await process.then(response => {
            if (response.data.errors) {
                if (typeof response.data.errors === "object" && !Object.keys(response.data.errors).length) {
                    return { state: true, data: response.data };
                } else {
                    console.error(`API Error: ${url}`, response.data.errors);
                    return { state: false, data: response.data };
                }
            }
            return { state: true, data: response.data };
        }).catch(error => {
            if (error.response.data && error.response.data.errors) {
                console.error(`API Error: ${url}`, error.response.data.errors);
            }
            return { state: false, data: error.response.data };
        });
    }

    return {
        validateDiscountCode: async (payload) => {
            let url = `/validate-discount-code.json`;
            return await processRequest('post', url, payload);
        },
        removeDiscountCode: async (uuid) => {
            let url = `/remove-discount-code.json`;
            return await processRequest('post', url, uuid);
        },
        processRequest: processRequest
    }
})();