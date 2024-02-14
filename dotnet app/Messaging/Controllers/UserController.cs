using System;
using Azure;
using Azure.Communication;
using Azure.Communication.Identity;
using Azure.Core;
using Messaging.Models;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace Messaging.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class UserController : ControllerBase
    {
        private readonly CommunicationIdentityClient _client;

        private readonly User _userClient = new User();

        public UserController(AzureCommunicationSettings configuration)
        {
            _client = new CommunicationIdentityClient(configuration.ConnectionString);
        }

        /// <summary>
        /// Create User and Generate token
        /// </summary>
        /// <returns></returns>
        [Route("token")]
        [HttpGet]
        public async Task<IActionResult> GetAsync()
        {
            try
            {
                Response<CommunicationUserIdentifierAndToken> response = await _client.CreateUserAndTokenAsync(scopes: new[] { CommunicationTokenScope.Chat });
                var responseValue = response.Value;
                var jsonFormattedUser = new
                {
                    communicationUserId = responseValue.User.Id
                };
                var clientResponse = new
                {
                    user = jsonFormattedUser,
                    token = responseValue.AccessToken.Token,
                    expiresOn = responseValue.AccessToken.ExpiresOn
                };
                return this.Ok(clientResponse);
            }
            catch (RequestFailedException ex)
            {
                Console.WriteLine($"Error occured while Generating Token: {ex}");
                return this.Ok(JsonConvert.DeserializeObject(JsonConvert.SerializeObject((ex))));
            }
        }
        /// <summary>
        /// Generate token for the User
        /// </summary>
        /// <returns></returns>
        [Route("refreshToken/{identity}")]
        [HttpGet]
        public async Task<IActionResult> GetAsync(string identity)
        {
            try
            {
                CommunicationUserIdentifier identifier = new CommunicationUserIdentifier(identity);
                Response<AccessToken> response = await _client.GetTokenAsync(identifier, scopes: new[] { CommunicationTokenScope.Chat });
                var responseValue = response.Value;
                var clientResponse = new
                {
                    token = responseValue.Token,
                    expiresOn = responseValue.ExpiresOn
                };
                return this.Ok(clientResponse);
            }
            catch (RequestFailedException ex)
            {
                Console.WriteLine($"Error occured while Generating Token: {ex}");
                return this.Ok(JsonConvert.DeserializeObject(JsonConvert.SerializeObject((ex))));
            }

        }

        /// <summary>
        /// Generate token for the User
        /// </summary>
        /// <returns></returns>
        [HttpGet("{userName}")]
        public async Task<IActionResult> GetUser(string userName, CancellationToken token)
        {
            var user = await _userClient.GetUser(userName, token);

            if(user == default)
            {
                var guid = await this.CreateUserAsync(token);
                user = new User() { UserId = guid, UserName = userName };
                await _userClient.SaveUser(user, token);
            }

            return Ok(Task.FromResult(user?.UserId));
        }

        [HttpGet("get-user/{userId}")]
        public async Task<IActionResult> GetUsers(string userId, CancellationToken token)
        {
            var users = await _userClient.GetUsers(token);
            return Ok(users.Where(x => x.UserId != userId));
        }

        private async Task<string> CreateUserAsync(CancellationToken token)
        { 
            var response = await _client.CreateUserAsync(token);
            return response.Value.Id;
        }
    }
}

