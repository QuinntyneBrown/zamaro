<?php

namespace Zamaro\PHPStan;

use PhpParser\Node;
use PhpParser\Node\Expr;
use PhpParser\Node\Identifier;
use PhpParser\Node\Name;
use PhpParser\Node\Scalar\String_;
use PHPStan\Analyser\Scope;
use PHPStan\Rules\Rule;
use PHPStan\Rules\RuleErrorBuilder;

/**
 * L2-075.2: SQL text is a literal; values travel as bindings. Fails the build when `DB::raw`,
 * `DB::select`, `DB::statement` (and the facade's other raw-SQL methods) or any `*Raw` builder method
 * gets a first argument built at run time, such as an interpolated or concatenated string
 * (security/authorise-and-validate-requests, M2 D27).
 *
 * @implements Rule<Expr\CallLike>
 */
final class NoNonLiteralRawSqlRule implements Rule
{
    /** DB facade methods whose first argument is SQL text. */
    private const DB_METHODS = ['raw', 'select', 'selectone', 'scalar', 'statement', 'unprepared', 'insert', 'update', 'delete', 'affectingstatement', 'cursor'];

    public function getNodeType(): string
    {
        return Expr\CallLike::class;
    }

    public function processNode(Node $node, Scope $scope): array
    {
        if (! ($node instanceof Expr\MethodCall || $node instanceof Expr\StaticCall) || ! $node->name instanceof Identifier) {
            return [];
        }
        $method = $node->name->toLowerString();
        $isDbFacade = $node instanceof Expr\StaticCall && $node->class instanceof Name
            && in_array($scope->resolveName($node->class), ['Illuminate\Support\Facades\DB', 'DB'], true);
        $takesSql = $method === 'raw' || str_ends_with($node->name->toString(), 'Raw') || ($isDbFacade && in_array($method, self::DB_METHODS, true));
        $sql = $node->getArgs()[0]->value ?? null;

        if (! $takesSql || $sql === null || $this->isLiteral($sql)) {
            return [];
        }

        return [
            RuleErrorBuilder::message("{$node->name->toString()}() takes SQL text built at run time. Write the SQL as a literal and pass values as bindings (L2-075.2).")
                ->identifier('zamaro.rawSql')
                ->build(),
        ];
    }

    /** A string literal, or literals joined with `.`. */
    private function isLiteral(Expr $expr): bool
    {
        return $expr instanceof String_
            || ($expr instanceof Expr\BinaryOp\Concat && $this->isLiteral($expr->left) && $this->isLiteral($expr->right));
    }
}
