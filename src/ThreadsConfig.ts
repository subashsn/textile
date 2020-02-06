import { grpc } from '@improbable-eng/grpc-web'
import { Config } from '@textile/threads-client'
import axios, { AxiosRequestConfig } from 'axios'
type Session = {
  id: string
  session_id: string
}
export class ThreadsConfig extends Config {
  public host: string
  public session?: string
  constructor(
    public token: string,
    public deviceId: string,
    public dev: boolean,
    public apiScheme: string = 'https',
    public api: string = 'cloud.textile.io',
    public sessionPort: number = 8006,
    public threadsPort: number = 6007,
    public transport: grpc.TransportFactory = grpc.WebsocketTransport(),
  ) {
    super()
    this.host = `${this.apiScheme}://${this.api}:${this.threadsPort}`
  }
  async start() {
    await this.refreshSession()
  }
  get sessionAPI(): string {
    return `${this.apiScheme}://${this.api}:${this.sessionPort}`
  }
  private async refreshSession() {
    if (this.dev) {
      return
    }
    const setup: AxiosRequestConfig = {
      baseURL: this.sessionAPI,
      responseType: 'json',
    }
    const apiClient = axios.create(setup)

    const resp = await apiClient.post<Session>(
      '/register',
      JSON.stringify({
        token: this.token,
        device_id: this.deviceId, // eslint-disable-line
      }),
    )
    if (resp.status !== 200) {
      new Error(resp.statusText)
    }
    this.session = resp.data.session_id
  }
  _wrapMetadata(values?: { [key: string]: any }): { [key: string]: any } | undefined {
    if (!this.session) {
      return values
    }
    const response = values ?? {}
    if ('Authorization' in response || 'authorization' in response) {
      return response
    }
    response['Authorization'] = `Bearer ${this.session}`
    return response
  }
  _wrapBrowserHeaders(values: grpc.Metadata): grpc.Metadata {
    if (!this.session) {
      return values
    }
    values.set('Authorization', `Bearer ${this.session}`)
    return values
  }
}