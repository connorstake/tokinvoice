import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import * as fs from 'fs';
import * as path from 'path';
import { IGoogleAuthCredentials } from '../interfaces/IGoogleAuthCredentials';
import * as dotenv from 'dotenv';
dotenv.config();

@Injectable()
export class GoogleService {
  private readonly scopesAPI: string[];
  private readonly credentialsPath: string;
  constructor(private configService: ConfigService) {
    this.credentialsPath = path.join(
      process.cwd(),
      this.configService.get('GOOGLE_CREDENTIALS_PATH')!,
    );
    this.scopesAPI = this.configService.get('GOOGLE_SCOPES_API').split(',');
  }

  readCredentials(filePath: string): IGoogleAuthCredentials {
    const credentialsPath = path.join(filePath);
    const content: string = fs.readFileSync(credentialsPath, 'utf-8');
    return JSON.parse(content);
  }
  async getOAuth2ClientUrl(): Promise<{ url: string }> {
    const authClient = this.getAuthClient();
    return this.getAuthUrl(authClient);
  }
  getAuthClient(): OAuth2Client {
    const keys: IGoogleAuthCredentials = this.readCredentials(
      this.credentialsPath,
    );
    const authClient = new OAuth2Client(
      keys.web.client_id,
      keys.web.client_secret,
      keys.web.redirect_uris[0],
    );
    return authClient;
  }
  getAuthUrl(authClient: OAuth2Client): { url: string } {
    // Generate the url that will be used for the consent dialog.
    const authorizeUrl = authClient.generateAuthUrl({
      access_type: 'offline',
      scope: this.scopesAPI,
      prompt: 'consent',
      include_granted_scopes: true,
    });
    return { url: authorizeUrl };
  }
  async getAuthClientData(
    code: string,
  ): Promise<{ email: string; refreshToken: string; accessToken: string }> {
    const authClient = this.getAuthClient();
    const tokenData = await authClient.getToken(code);
    const tokens = tokenData.tokens;
    const refreshToken = tokens?.refresh_token || '';
    const accessToken = tokens?.access_token || '';

    authClient.setCredentials(tokens);

    const googleAuth = google.oauth2({
      version: 'v2',
      auth: authClient,
    } as any);

    try {
      const googleUserInfo = await googleAuth.userinfo.get();
      const email = googleUserInfo.data.email!;
      return { email, refreshToken, accessToken };
    } catch (error) {
      console.error(
        'Error exchanging code for tokens:',
        error.response?.data || error.message,
      );
      throw new Error('Failed to exchange authorization code for tokens');
    }
  }
}
