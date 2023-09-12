import crypto from 'crypto'

class User {
  id?: string | undefined
  name?: string | undefined
  username: string
  password: string
  token?: string | undefined
  fingerprintID?: string | undefined

  constructor(data?: User) {
    if (data) {
      this.id = data.id || crypto.randomUUID()
      this.name = data.name || ''
      this.username = data.username
      this.password = data.password
      this.token = data.token || ''
      this.fingerprintID = data.fingerprintID || ''
    } else {
      this.id = ''
      this.name = ''
      this.username = ''
      this.password = ''
      this.token = ''
      this.fingerprintID = ''
    }
  }
}

export default User
