import { useEffect, useState } from "react";

import axios from "axios";
import { AxiosInstance } from "axios";

import { LaunchProps, getPreferenceValues, Detail } from "@raycast/api";

interface Message {
    role?: string
    content?: string
}

interface Choice {
    index?: number
    finish_reason?: string
    message?: Message
}

interface Usage {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
}

interface Response {
    id?: string
    object?: string
    created?: number
    model?: string
    choices?: Choice[]
    usage?: Usage
}


interface State {
  item?: Response;
  error?: Error;
}

interface Query {
    query: string
}

interface Preferences {
    apiKey: string;
    proxyHost?: string
    proxyPort?: number
    proxyProtocol?: string
}

export default function Command(props: LaunchProps<{ arguments: Query }>) {
    const preferences = getPreferenceValues<Preferences>();
    console.log("1. ", preferences)
    console.log("2. ", props.arguments.query)
    const [state, setState] = useState<State>({});
    useEffect(() => {
        async function fetchStories() {
            try {
                let http: AxiosInstance;
                if (preferences.proxyHost != undefined && preferences.proxyPort != undefined && preferences.proxyProtocol != undefined) {
                    http = axios.create({
                        baseURL: 'https://api.openai.com',
                        proxy: {
                            host: preferences.proxyHost,
                            port: preferences.proxyPort,
                            protocol:preferences.proxyProtocol
                        },
                        headers: {
                            Authorization: "Bearer " + preferences.apiKey,
                            "Content-Type": "application/json"
                        }
                    })
                } else {
                    http = axios.create({
                        baseURL: 'https://api.openai.com',
                        headers: {
                            Authorization: "Bearer " + preferences.apiKey,
                            "Content-Type": "application/json"
                        }
                    })
                }
                
                const resp = await http.post(
                    `/v1/chat/completions`,
                    {"model": "gpt-3.5-turbo", "messages": [{"role": "user", "content": props.arguments.query}]}
                )
                console.log(">", resp.data)
                setState({ item: resp.data });
            } catch (error) {
                setState({
                    error: error instanceof Error ? error : new Error("Something went wrong"),
                });
            }
        }

        fetchStories();
    }, []);

    const result = state.item?.choices?.[0].message?.content    
    return <Detail isLoading={!state.item?.['choices'] && !state.error} markdown={result || state.error?.message} />;
}
