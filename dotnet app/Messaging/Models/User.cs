using System;
using System.Text.Json;
using Newtonsoft.Json.Linq;

namespace Messaging.Models
{
    public class User
    {

        public readonly string _path = null!;
        public string UserName { get; set; } = null!;
        public string UserId { get; set; } = null!;

        public User()
        {
            _path = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Data", "Users.json");
        }

        public async Task<List<User>?> GetUsers(CancellationToken token)
        {
            string usersString = await File.ReadAllTextAsync(_path, token);

            if(string.IsNullOrEmpty(usersString))
            {
                return new List<User>();
            }

            return JsonSerializer.Deserialize<List<User>>(usersString);
        }

        public async Task<User?> GetUser(string userName, CancellationToken token)
        {
            string usersString = await File.ReadAllTextAsync(_path, token);
            var users = JsonSerializer.Deserialize<List<User>>(usersString);
            return users?.Find(x => x.UserName.ToLower() == userName.ToLower());
        }

        public async Task<bool> SaveUser(User user, CancellationToken token)
        {
            string usersString = await File.ReadAllTextAsync(_path, token);
            var users = JsonSerializer.Deserialize<List<User>>(usersString);

            if(users != default)
            {
                users.Add(user);
                var jsonString = JsonSerializer.Serialize(users);
                await File.WriteAllTextAsync(_path, jsonString, token);
                return true;
            }

            return false;
        }
    }
}

