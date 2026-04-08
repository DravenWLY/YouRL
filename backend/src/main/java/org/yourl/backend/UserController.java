package org.yourl.backend;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final BigTableService bigTableService;

    public UserController(BigTableService bigTableService) {
        this.bigTableService = bigTableService;
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody AuthRequests.SignupRequest request) {
        try {
            UserAccount user = bigTableService.createUser(request.username(), request.password());
            return ResponseEntity.ok(user);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequests.LoginRequest request) {
        UserAccount user = bigTableService.getUser(request.username());
        if (user != null && user.password().equals(request.password())) {
            return ResponseEntity.ok(user); // In a real app, return a JWT token here
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErrorResponse("Invalid credentials"));
    }

    @PutMapping("/{username}/password")
    public ResponseEntity<?> changePassword(@PathVariable String username, @RequestBody AuthRequests.PasswordChangeRequest request) {
        UserAccount user = bigTableService.getUser(username);
        if (user != null && user.password().equals(request.oldPassword())) {
            UserAccount updatedUser = new UserAccount(user.username(), user.userId(), request.newPassword(), user.isPaid());
            bigTableService.updateUser(updatedUser);
            return ResponseEntity.ok(updatedUser);
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErrorResponse("Invalid credentials"));
    }

    @PostMapping("/{username}/upgrade")
    public ResponseEntity<?> upgradeMembership(@PathVariable String username) {
        UserAccount user = bigTableService.getUser(username);
        if (user != null) {
            UserAccount updatedUser = new UserAccount(user.username(), user.userId(), user.password(), true);
            bigTableService.updateUser(updatedUser);
            return ResponseEntity.ok(updatedUser);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{username}")
    public ResponseEntity<?> deleteAccount(@PathVariable String username) {
        bigTableService.deleteUser(username);
        return ResponseEntity.ok().build();
    }
}